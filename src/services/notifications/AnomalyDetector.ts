import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getDatabase } from '../database';

export class AnomalyDetector {
  async checkAndNotify(
    amount: number,
    type: string,
    categoryId: string | null,
    merchant: string | null
  ): Promise<void> {
    if (type !== 'debit') return;

    const db = getDatabase();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;

    // Get average amount for the same category in last 90 days
    let avgResult: { avg_amount: number | null; count: number } | null = null;

    if (categoryId) {
      avgResult = db.getFirstSync<{ avg_amount: number | null; count: number }>(
        `SELECT AVG(amount) as avg_amount, COUNT(*) as count
         FROM transactions
         WHERE type = 'debit' AND category_id = ? AND date >= ?`,
        [categoryId, ninetyDaysAgo]
      );
    }

    // If no category average, try merchant average
    if ((!avgResult || !avgResult.avg_amount || avgResult.count < 2) && merchant) {
      avgResult = db.getFirstSync<{ avg_amount: number | null; count: number }>(
        `SELECT AVG(amount) as avg_amount, COUNT(*) as count
         FROM transactions
         WHERE type = 'debit' AND merchant = ? AND date >= ?`,
        [merchant, ninetyDaysAgo]
      );
    }

    if (!avgResult || !avgResult.avg_amount || avgResult.count < 2) return;

    // Check if amount is > 2x the average
    if (amount > avgResult.avg_amount * 2) {
      const label = merchant || 'transaction';
      await this.sendNotification(
        'Unusual Spending Alert',
        `₹${amount.toLocaleString('en-IN')} at ${label} is significantly higher than your average of ₹${Math.round(avgResult.avg_amount).toLocaleString('en-IN')}`
      );
    }
  }

  private async sendNotification(title: string, body: string): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // Immediate
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('anomaly-alerts', {
        name: 'Spending Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        sound: 'default',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  static configureHandler(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  }
}

export const anomalyDetector = new AnomalyDetector();
