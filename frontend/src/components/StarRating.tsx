export const StarRating = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => {
  return (
    <div style={{ display: 'flex', gap: 2 }} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          role={onChange ? 'radio' : undefined}
          aria-checked={onChange ? star === value : undefined}
          onClick={onChange ? () => onChange(star) : undefined}
          style={{
            fontSize: 20,
            cursor: onChange ? 'pointer' : 'default',
            color: star <= value ? '#000' : '#d4d4d4',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
};