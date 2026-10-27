import type { FormValues } from "@/lib/join";
import { joinFields, mobilePrefixes, type JoinField } from "@/lib/site-config";

const inputClass =
  "h-[26px] w-[125px] border border-hairline px-[6px] text-[12.5px] outline-none";

export type FieldNote = { text: string; ok: boolean };

type FieldProps = {
  values: FormValues;
  onChange: (id: string, value: string) => void;
  onBlur?: (id: string) => void;
};

function Required() {
  return (
    <span className="ml-[4px] align-middle text-[11px] text-[#f0736b]" aria-hidden>
      ✱
    </span>
  );
}

function FieldControl({ field, values, onChange, onBlur }: FieldProps & { field: JoinField }) {
  if (field.type === "phone") {
    const digits = (id: string, maxLength: number) => (
      <input
        type="text"
        inputMode="numeric"
        maxLength={maxLength}
        aria-label={`${field.label} ${id.endsWith("2") ? "가운데자리" : "뒷자리"}`}
        value={values[id] ?? ""}
        onChange={(e) => onChange(id, e.target.value.replace(/\D/g, ""))}
        className={`${inputClass} w-[58px]`}
      />
    );

    return (
      <div className="flex items-center gap-[6px]">
        <select
          aria-label={`${field.label} 앞자리`}
          value={values[`${field.id}1`] ?? mobilePrefixes[0]}
          onChange={(e) => onChange(`${field.id}1`, e.target.value)}
          className="h-[26px] w-[60px] border border-hairline px-[4px] text-[12.5px] outline-none"
        >
          {mobilePrefixes.map((prefix) => (
            <option key={prefix}>{prefix}</option>
          ))}
        </select>
        <span>-</span>
        {digits(`${field.id}2`, 4)}
        <span>-</span>
        {digits(`${field.id}3`, 4)}
      </div>
    );
  }

  return (
    <input
      type={field.type ?? "text"}
      aria-label={field.label}
      autoComplete={field.type === "password" ? "new-password" : "off"}
      value={values[field.id] ?? ""}
      onChange={(e) => onChange(field.id, e.target.value)}
      onBlur={() => onBlur?.(field.id)}
      className={inputClass}
    />
  );
}

export default function JoinFields({
  fields = joinFields,
  notes = {},
  ...props
}: FieldProps & { fields?: JoinField[]; notes?: Record<string, FieldNote | undefined> }) {
  return (
    <div className="border-t border-hairline">
      {fields.map((field) => {
        const note = notes[field.id];
        return (
          <div key={field.id} className="flex border-b border-hairline">
            <div className="w-[150px] shrink-0 py-[7px] text-[13px] leading-[26px]">
              {field.label}
              {field.required && <Required />}
            </div>
  
            <div className="min-w-0 flex-1 border-l border-hairline py-[7px] pl-[10px]">
              <FieldControl field={field} {...props} />
              {note ? (
                <p
                  className={`mt-[4px] text-[12.5px] ${note.ok ? "text-[#2b7de9]" : "text-[#f0736b]"}`}
                >
                  {note.text}
                </p>
              ) : (
                field.help && <p className="mt-[4px] text-[12.5px] text-ink-soft">{field.help}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
