import { Subject } from '@/infra/communication/subject'
import { connectWsServer } from '@/infra/communication/connect'
import { MockWebSocketServer } from '../../helpers/ws'

describe('Communication infra', () => {
  interface Foo {
    id: string
    value: string
  }

  let mockServer: MockWebSocketServer
  let mockSubject: Subject<any>
  let dummyData: Foo[]

  beforeEach(() => {
    mockServer = new MockWebSocketServer()
    mockSubject = new Subject()

    dummyData = [
      {
        id: '1',
        value: 'test'
      },
      {
        id: '2',
        value: 'test 2'
      }
    ]
  })

  describe('resolver', () => {
    const resolver = {
      get(id: string): Foo | undefined {
        return dummyData.find(d => d.id === id)
      },

      all(): Foo[] {
        return dummyData
      }
    }

    beforeEach(() => {
      connectWsServer({
        resolver,
        mutator: {},
        subject: mockSubject,
        server: mockServer
      })
    })

    it('resolves a value with a resolver method', () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'resolver:get',
        args: ['2'],
        requestId: '1'
      })

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('resolver:get')
      expect(res.data).toEqual(dummyData[1])
      expect(res.requestId).toBe('1')
    })

    it('resolves values with a resolver method', () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'resolver:all',
        args: [],
        requestId: '2'
      })

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('resolver:all')
      expect(res.data).toEqual(dummyData)
      expect(res.requestId).toBe('2')
    })
  })

  describe('mutator', () => {
    const mutator = {
      update(id: string, value: string): void {
        const data = dummyData.find(d => d.id === id)
        if (data) {
          data.value = value
        }
      }
    }

    beforeEach(() => {
      connectWsServer({
        resolver: {},
        mutator,
        subject: mockSubject,
        server: mockServer
      })
    })

    it('mutates a value with a mutator method', () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'mutator:update',
        args: ['2', 'updated'],
        requestId: '1'
      })

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('mutator:update')
      expect(res.requestId).toBe('1')

      expect(dummyData[1]).toEqual({
        id: '2',
        value: 'updated'
      })
    })
  })

  describe('subject', () => {
    beforeEach(() => {
      connectWsServer({
        resolver: {},
        mutator: {},
        subject: mockSubject,
        server: mockServer
      })
    })

    it('notifies that some value is added', () => {
      const ws = mockServer.connectClient()

      const data = {
        id: '3',
        value: 'test'
      }

      mockSubject.notifyAdd(data)

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('subject:add')
      expect(res.data).toEqual(data)
    })

    it('notifies that some value is updateded', () => {
      const ws = mockServer.connectClient()

      const data = {
        id: '2',
        value: 'test'
      }

      mockSubject.notifyUpdate(data)

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('subject:update')
      expect(res.data).toEqual(data)
    })

    it('notifies that some value is removed', () => {
      const ws = mockServer.connectClient()

      const data = {
        id: '1',
        value: 'test'
      }

      mockSubject.notifyRemove(data)

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('subject:remove')
      expect(res.data).toEqual(data)
    })

    it('unsubscribe observer after the connection is closed', () => {
      const ws = mockServer.connectClient()

      const data = {
        id: '1',
        value: 'updated'
      }

      ws.close()
      mockSubject.notifyUpdate(data)
      expect(ws.received.length).toBe(0)
    })
  })
})
