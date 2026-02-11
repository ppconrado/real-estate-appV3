"use client";

type Option = {
  value: string;
  label: string;
};

type AutoSubmitSelectProps = {
  action: (formData: FormData) => void | Promise<void>;
  idName: string;
  idValue: number;
  name: string;
  defaultValue: string;
  options: Option[];
  className?: string;
};

export default function AutoSubmitSelect({
  action,
  idName,
  idValue,
  name,
  defaultValue,
  options,
  className,
}: AutoSubmitSelectProps) {
  return (
    <form action={action}>
      <input type="hidden" name={idName} value={idValue} />
      <select
        name={name}
        defaultValue={defaultValue}
        className={className}
        onChange={event => event.currentTarget.form?.requestSubmit()}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
