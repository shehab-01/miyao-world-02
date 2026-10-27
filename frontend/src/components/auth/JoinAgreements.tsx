"use client";

import type { Checks } from "@/lib/join";
import { joinAgeCheck, joinAgreeAllLabel, joinAgreements } from "@/lib/site-config";

const allIds = [
  joinAgeCheck.id,
  ...joinAgreements.flatMap((section) => section.checks.map((check) => check.id)),
];

const checkboxClass = "h-[14px] w-[14px] accent-ink";

export default function JoinAgreements({
  checked,
  onChange,
}: {
  checked: Checks;
  onChange: (checked: Checks) => void;
}) {
  const allChecked = allIds.every((id) => checked[id]);

  return (
    <section>
      <h2 className="text-[14px]">전체 동의</h2>

      <div className="mt-[14px] border border-hairline">
        <div className="space-y-[12px] px-[24px] py-[20px]">
          <label className="flex items-center gap-[10px] text-[13px] font-bold">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) =>
                onChange(Object.fromEntries(allIds.map((id) => [id, e.target.checked])))
              }
              className={checkboxClass}
            />
            {joinAgreeAllLabel}
          </label>
          <label className="flex items-center gap-[10px] text-[13px]">
            <input
              type="checkbox"
              checked={checked[joinAgeCheck.id] ?? false}
              onChange={(e) => onChange({ ...checked, [joinAgeCheck.id]: e.target.checked })}
              className={checkboxClass}
            />
            {joinAgeCheck.label}
          </label>
        </div>

        {joinAgreements.map((section) => (
          <div
            key={section.title}
            className="border-t border-hairline px-[24px] py-[20px]"
          >
            <h3 className="text-[13px] text-ink-soft">{section.title}</h3>

            <div className="mt-[14px] h-[150px] overflow-y-auto border border-hairline px-[24px] py-[18px] text-[12.5px] leading-[1.8]">
              <p className="whitespace-pre-line">{section.content}</p>
            </div>

            <div className="mt-[16px] space-y-[8px]">
              {section.checks.map((check) => (
                <label
                  key={check.id}
                  className="flex items-center gap-[10px] text-[13px]"
                >
                  <span className={section.checks.length > 1 ? "w-[210px]" : ""}>
                    {check.label}
                  </span>
                  <input
                    type="checkbox"
                    checked={checked[check.id] ?? false}
                    onChange={(e) => onChange({ ...checked, [check.id]: e.target.checked })}
                    className={checkboxClass}
                  />
                  동의함
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
