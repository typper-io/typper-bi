export const getYearAndMonth = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1

  return { year, month }
}
