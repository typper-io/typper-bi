export const MobileHide = () => {
  return (
    <div className="absolute top-0 bottom-0 right-0 left-0 w-screen h-screen z-[99999] bg-background flex flex-col justify-center gap-4 tablet:hidden p-8">
      <h1 className="font-semibold text-2xl">
        Sorry, this app is not available on mobile.
      </h1>
      <p className="text-muted-foreground">
        Please use a desktop or laptop computer.
      </p>
    </div>
  )
}
