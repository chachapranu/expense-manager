import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { Linking } from 'react-native';
import { getDatabase, generateId } from '../services/database';

const nameToWidget: Record<string, React.ComponentType> = {
  QuickAdd: require('./QuickAddWidget').QuickAddWidget,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget = nameToWidget[widgetInfo.widgetName];

  if (props.clickAction) {
    if (props.clickAction === 'ADD_EXPENSE') {
      const data = props.clickActionData as Record<string, string> | undefined;
      const amount = parseFloat(data?.amount || '0');
      if (amount > 0) {
        try {
          const db = getDatabase();
          const id = generateId();
          const now = Date.now();

          db.runSync(
            `INSERT INTO transactions (id, amount, type, date, notes, merchant, category_id, account_id, source, raw_sms, reference_number, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id,
              amount,
              'debit',
              now,
              'Added via widget',
              null,
              null,
              null,
              'manual',
              null,
              null,
              now,
              now,
            ]
          );
        } catch (error) {
          console.error('Widget: Failed to save transaction:', error);
        }
      }
    } else if (props.clickAction === 'OPEN_APP') {
      Linking.openURL('expense-manager:///transaction/add').catch(() => {
        Linking.openURL('expense-manager://').catch(() => {});
      });
    }
    return;
  }

  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      if (Widget) {
        props.renderWidget(React.createElement(Widget));
      }
      break;

    case 'WIDGET_DELETED':
      break;
  }
}
