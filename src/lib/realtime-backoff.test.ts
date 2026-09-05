import { withReconnect } from "./realtime-backoff"

function makeFakeChannel() {
  return {
    topic: "test-channel",
    subscribe: jest.fn(),
  } as any
}

describe("withReconnect", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("passes every status through to the caller's handler", () => {
    const channel = makeFakeChannel()
    const onStatus = jest.fn()
    const { handleStatus } = withReconnect(channel, onStatus)

    handleStatus("SUBSCRIBED")
    expect(onStatus).toHaveBeenCalledWith("SUBSCRIBED")
  })

  it("schedules a resubscribe with backoff on CHANNEL_ERROR", () => {
    const channel = makeFakeChannel()
    const { handleStatus } = withReconnect(channel)

    handleStatus("CHANNEL_ERROR")
    expect(channel.subscribe).not.toHaveBeenCalled()

    jest.advanceTimersByTime(1000)
    expect(channel.subscribe).toHaveBeenCalledTimes(1)
  })

  it("increases the delay exponentially across repeated failures", () => {
    const channel = makeFakeChannel()
    const { handleStatus } = withReconnect(channel)

    handleStatus("TIMED_OUT")
    jest.advanceTimersByTime(999)
    expect(channel.subscribe).not.toHaveBeenCalled()
    jest.advanceTimersByTime(1)
    expect(channel.subscribe).toHaveBeenCalledTimes(1)

    handleStatus("TIMED_OUT")
    jest.advanceTimersByTime(1999)
    expect(channel.subscribe).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(channel.subscribe).toHaveBeenCalledTimes(2)
  })

  it("resets the attempt counter after a successful SUBSCRIBED", () => {
    const channel = makeFakeChannel()
    const { handleStatus } = withReconnect(channel)

    handleStatus("CHANNEL_ERROR")
    jest.advanceTimersByTime(1000) // first retry fires at 1s
    handleStatus("SUBSCRIBED") // recovered

    handleStatus("CHANNEL_ERROR") // fails again, should back off from 1s again, not 2s
    jest.advanceTimersByTime(999)
    expect(channel.subscribe).toHaveBeenCalledTimes(1)
    jest.advanceTimersByTime(1)
    expect(channel.subscribe).toHaveBeenCalledTimes(2)
  })

  it("stops retrying after cancel() is called", () => {
    const channel = makeFakeChannel()
    const { handleStatus, cancel } = withReconnect(channel)

    handleStatus("CHANNEL_ERROR")
    cancel()
    jest.advanceTimersByTime(30000)
    expect(channel.subscribe).not.toHaveBeenCalled()
  })

  it("ignores statuses other than CHANNEL_ERROR/TIMED_OUT", () => {
    const channel = makeFakeChannel()
    const { handleStatus } = withReconnect(channel)

    handleStatus("CLOSED")
    jest.advanceTimersByTime(30000)
    expect(channel.subscribe).not.toHaveBeenCalled()
  })
})
