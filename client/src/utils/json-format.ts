const jsonFormat = (json: string) => {
  try {
    const parsedJson = JSON.parse(json)

    return JSON.stringify(parsedJson, null, 2)
  } catch (error) {
    return json
  }
}
