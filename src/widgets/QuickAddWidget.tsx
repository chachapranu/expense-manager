import React from 'react';
import {
  FlexWidget,
  TextWidget,
} from 'react-native-android-widget';

const PRESET_AMOUNTS = [100, 500, 1000];

export function QuickAddWidget() {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 12,
        flexDirection: 'column',
        justifyContent: 'center',
        flexGap: 8,
      }}
    >
      <TextWidget
        text="Quick Add Expense"
        style={{
          fontSize: 14,
          fontWeight: 'bold',
          color: '#000000',
        }}
      />

      <FlexWidget
        style={{
          flexDirection: 'row',
          width: 'match_parent',
          justifyContent: 'space-between',
          flexGap: 8,
        }}
      >
        {PRESET_AMOUNTS.map((amount) => (
          <FlexWidget
            key={amount}
            clickAction="ADD_EXPENSE"
            clickActionData={{ amount: String(amount) }}
            style={{
              flex: 1,
              height: 44,
              backgroundColor: '#000000',
              borderRadius: 8,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <TextWidget
              text={`₹${amount}`}
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}
            />
          </FlexWidget>
        ))}

        <FlexWidget
          clickAction="OPEN_APP"
          clickActionData={{}}
          style={{
            flex: 1,
            height: 44,
            backgroundColor: '#666666',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <TextWidget
            text="Custom"
            style={{
              fontSize: 14,
              fontWeight: 'bold',
              color: '#FFFFFF',
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
