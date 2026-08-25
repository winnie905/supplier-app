import { ReceivingSummaryCard } from '@/sections/receiving/ReceivingSummaryCard';

export const PackingSummaryCard = ({
  boxCount,
  pieceCount,
}: {
  boxCount: number;
  pieceCount: number;
}) => (
  <ReceivingSummaryCard
    rows={[
      { label: '装箱数:', value: `${boxCount}箱` },
      { label: '总件数:', value: `${pieceCount}件` },
    ]}
  />
);
