function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface LineItemInput {
  unitPrice: number;
  quantity: number;
  discountAmount: number;
  taxPercent: number;
  cessPercent: number;
  isIgst: boolean;
}

export function calculateLineItem(input: LineItemInput) {
  const taxableValue = round2(input.unitPrice * input.quantity - input.discountAmount);
  const taxAmount = round2(taxableValue * (input.taxPercent / 100));
  const cessAmount = round2(taxableValue * (input.cessPercent / 100));

  const cgstAmount = input.isIgst ? 0 : round2(taxAmount / 2);
  const sgstAmount = input.isIgst ? 0 : round2(taxAmount / 2);
  const igstAmount = input.isIgst ? taxAmount : 0;

  const total = round2(taxableValue + taxAmount + cessAmount);

  return { taxableValue, cgstAmount, sgstAmount, igstAmount, cessAmount, total };
}
