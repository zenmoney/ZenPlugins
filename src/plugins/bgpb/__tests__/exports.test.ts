describe('runtime entrypoint contract', () => {
  it('exports only the scrape operation understood by Zenmoney', () => {
    const entrypoint: Record<string, unknown> = jest.requireActual('../index')

    expect(Object.keys(entrypoint).sort()).toEqual(['scrape'])
  })
})
