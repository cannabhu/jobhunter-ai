import { FeatureSplit } from "@/components/homepage/FeatureSplit";

export function Features() {
  return (
    <>
      <FeatureSplit
        heading="Manage Your Job Search With Ease"
        activeIndex={0}
        imageSide="right"
        imageSrc="/images/jobs-lists.png"
        imageAlt="List of matched jobs with match scores and salary estimates"
        imageWidth={2364}
        imageHeight={1778}
        items={[
          {
            title: "Find jobs that actually fit",
            description:
              "Search by title and location or paste a job link. Get matched roles you can quickly scan.",
          },
          {
            title: "Know the Company Before You Apply",
            description:
              "Stop guessing what a company is about. JobPilot browses their site and gives you everything you need to apply with confidence.",
          },
          {
            title: "Keep track of every application",
            description:
              "Keep a clear view of every job you've found, tailored. Your activity and progress all stay in one simple place.",
          },
        ]}
      />
      <div className="h-10 border-b border-border bg-surface" aria-hidden />
      <FeatureSplit
        heading="Apply With More Confidence, Every Time"
        activeIndex={1}
        imageSide="left"
        imageSrc="/images/agnet-log.png"
        imageAlt="Agent log showing JobPilot scanning and filtering matching roles"
        imageWidth={2144}
        imageHeight={1656}
        items={[
          {
            title: "Understand your match score",
            description:
              "See how your profile lines up with each role before you apply. Get a clear breakdown of what fits and what's missing.",
          },
          {
            title: "AI-Powered Job Matching",
            description:
              "Stop guessing which jobs are worth applying to. JobPilot scores every role against your actual skills so you focus on the ones that matter.",
          },
          {
            title: "Focus on the right roles",
            description:
              "Filter out low fit jobs and stay on the ones that actually matter. Spend less time sorting and more time applying.",
          },
        ]}
      />
    </>
  );
}
