'use client'

export default function GlobalError() {
  return (
    <div className="bg-background h-screen w-screen flex flex-col justify-center items-center gap-2">
      <h2 className="text-3xl font-semibold">Internal server error</h2>
      <div>
        <p className="text-base">
          We ask you to please try again in a few minutes.
        </p>
        <p className="text-base">
          If the error persists, contact us:{' '}
          <a className="text-primary" href="mailto:help-bi@typper.io">
            help-bi@typper.io
          </a>
        </p>
      </div>
    </div>
  )
}
