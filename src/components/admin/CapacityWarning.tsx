import Alert from '@/components/ui/Alert';

interface Props {
  warnings: string[];
}

export default function CapacityWarning({ warnings }: Props) {
  if (warnings.length === 0) return null;
  return (
    <Alert variant="warning">
      <p className="font-medium mb-1">Varningar</p>
      <ul className="list-disc list-inside space-y-0.5">
        {warnings.map((w, i) => (
          <li key={i}>{w}</li>
        ))}
      </ul>
    </Alert>
  );
}
