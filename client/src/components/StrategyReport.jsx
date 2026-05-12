import React from 'react';

export default function StrategyReport({ type, data }) {
  if (!data) return <p>No data available for this report.</p>;

  switch (type) {
    case 'validation':
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium uppercase tracking-wider text-[#6a6055]">Market Need</span>
            <span className="text-2xl font-bold text-[#249a52]">{data.marketNeed}</span>
          </div>
          <div>
            <h4 className="font-semibold text-[#1f201d]">Sentiment</h4>
            <p className="mt-1 capitalize text-[#544b40]">{data.sentiment}</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#1f201d]">Pain Points Addressed</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#544b40]">
              {data.painPointsAddressed?.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1f201d]">Risks</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#544b40]">
              {data.risks?.map((risk, i) => (
                <li key={i}>{risk}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl bg-[#f4ebdd] p-5">
            <h4 className="font-semibold text-[#1f201d]">Executive Summary</h4>
            <p className="mt-2 leading-relaxed text-[#4f473d]">{data.validationSummary}</p>
          </div>
        </div>
      );

    case 'launch-plan':
      return (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-[#1f201d]">Preparation Phase</h4>
            <ul className="mt-2 space-y-2">
              {data.prepPhase?.map((task, i) => (
                <li key={i} className="flex items-start gap-3 text-[#544b40]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#cfeace] text-xs font-bold text-[#249a52]">{i + 1}</span>
                  {task}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1f201d]">Launch Day</h4>
            <ul className="mt-2 space-y-2">
              {data.launchDay?.map((task, i) => (
                <li key={i} className="flex items-start gap-3 text-[#544b40]">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#1f201d] text-xs font-bold text-white">{i + 1}</span>
                  {task}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-[#1f201d]">Organic Growth Channels</h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.organicStrategies?.map((strat, i) => (
                <span key={i} className="rounded-full bg-[#f4ebdd] px-3 py-1 text-xs font-medium text-[#8a7b69]">{strat}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold text-[#1f201d]">Draft Social Copy</h4>
            <div className="mt-2 rounded-xl border border-[#eadbc7] bg-white p-4 italic text-[#4f473d]">
              "{data.draftSocialCopy}"
            </div>
          </div>
        </div>
      );

    case '100-day-plan':
      return (
        <div className="space-y-8">
          <div className="border-l-4 border-[#249a52] pl-4">
            <h4 className="text-lg font-bold text-[#1f201d]">Day 30: Foundation</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#544b40]">
              {data.day30?.tasks?.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p className="mt-2 text-sm font-medium text-[#249a52]">Targets: {data.day30?.targetUsers} Users | {data.day30?.targetTraffic} Traffic</p>
          </div>
          <div className="border-l-4 border-[#8a7b69] pl-4">
            <h4 className="text-lg font-bold text-[#1f201d]">Day 60: Traction</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#544b40]">
              {data.day60?.tasks?.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p className="mt-2 text-sm font-medium text-[#8a7b69]">Targets: {data.day60?.targetUsers} Users | {data.day60?.targetTraffic} Traffic</p>
          </div>
          <div className="border-l-4 border-[#1f201d] pl-4">
            <h4 className="text-lg font-bold text-[#1f201d]">Day 100: Scale</h4>
            <ul className="mt-2 list-inside list-disc space-y-1 text-[#544b40]">
              {data.day100?.tasks?.map((t, i) => <li key={i}>{t}</li>)}
            </ul>
            <p className="mt-2 text-sm font-medium text-[#1f201d]">Targets: {data.day100?.targetUsers} Users | {data.day100?.targetTraffic} Traffic</p>
          </div>
          <div className="rounded-2xl bg-[#eef9ef] p-4 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-[#249a52]">Primary North Star Metric</p>
            <p className="mt-1 text-xl font-bold text-[#1f201d]">{data.primaryMetricFocus}</p>
          </div>
        </div>
      );

    default:
      return <pre className="overflow-auto rounded-lg bg-gray-50 p-4 text-xs">{JSON.stringify(data, null, 2)}</pre>;
  }
}
