import { describe, beforeEach, it, expect } from 'vitest'
import { Subject } from '../../../src/infra/communication/subject'
import { MockWebSocketServer } from '../../helpers/ws'

interface SubjectTypes {
  foo: {
    message: string
  }
  bar: {
    value: number
  }
}

describe('Communication infra Subjct', () => {
  let subject: Subject<SubjectTypes>
  let mockServer: MockWebSocketServer

  beforeEach(() => {
    mockServer = new MockWebSocketServer()
    subject = new Subject(mockServer)
  })

  it('sends notification to clients', () => {
    const a = mockServer.connectClient()
    const b = mockServer.connectClient()

    subject.notify('foo', {
      message: 'test',
    })

    expect(a.received.length).toBe(1)
    expect(b.received.length).toBe(1)
    expect(a.received[0]).toEqual({
      type: 'subject:foo',
      data: {
        message: 'test',
      },
    })
    expect(b.received[0]).toEqual({
      type: 'subject:foo',
      data: {
        message: 'test',
      },
    })
  })
})
