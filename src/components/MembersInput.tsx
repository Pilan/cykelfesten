'use client';

interface Props {
  members: string[];
  onChange: (members: string[]) => void;
}

export default function MembersInput({ members, onChange }: Props) {
  const update = (index: number, value: string) => {
    const next = [...members];
    next[index] = value;
    onChange(next);
  };

  const add = () => onChange([...members, '']);

  const remove = (index: number) => {
    if (members.length <= 1) return;
    onChange(members.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">
        Namn på hushållsmedlemmar <span className="text-red-500">*</span>
      </label>
      {members.map((name, i) => (
        <div key={i} className="flex gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => update(i, e.target.value)}
            placeholder={`Person ${i + 1}`}
            required
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {members.length > 1 && (
            <button
              type="button"
              onClick={() => remove(i)}
              className="px-2 py-1 text-red-500 hover:text-red-700 text-lg leading-none"
              aria-label="Ta bort"
            >
              ×
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="self-start text-sm text-green-600 hover:text-green-800 font-medium"
      >
        + Lägg till person
      </button>
    </div>
  );
}
