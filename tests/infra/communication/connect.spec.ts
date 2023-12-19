import { connectWsServer } from '../../../src/infra/communication/connect'
import { describe, beforeEach, it, expect } from 'vitest'
import { MockWebSocketServer } from '../../helpers/ws'

describe('Communication infra', () => {
  interface Foo {
    id: string
    value: string
  }

  let mockServer: MockWebSocketServer
  let dummyData: Foo[]

  beforeEach(() => {
    mockServer = new MockWebSocketServer()

    dummyData = [
      {
        id: '1',
        value: 'test',
      },
      {
        id: '2',
        value: 'test 2',
      },
    ]
  })

  describe('resolver', () => {
    const resolver = {
      get(id: string): Foo | undefined {
        return dummyData.find((d) => d.id === id)
      },

      all(): Foo[] {
        return dummyData
      },

      promise(id: string): Promise<Foo | undefined> {
        return Promise.resolve(dummyData.find((d) => d.id === id))
      },
    }

    beforeEach(() => {
      connectWsServer({
        resolver,
        mutator: {},
        server: mockServer,
      })
    })

    it('resolves a value with a resolver method', async () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'resolver:get',
        args: ['2'],
        requestId: '1',
      })

      await Promise.resolve()

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('resolver:get')
      expect(res.data).toEqual(dummyData[1])
      expect(res.requestId).toBe('1')
    })

    it('resolves values with a resolver method', async () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'resolver:all',
        args: [],
        requestId: '2',
      })

      await Promise.resolve()

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('resolver:all')
      expect(res.data).toEqual(dummyData)
      expect(res.requestId).toBe('2')
    })

    it('resolves returned promise', async () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'resolver:promise',
        args: ['2'],
        requestId: '3',
      })

      await Promise.resolve()

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('resolver:promise')
      expect(res.data).toEqual(dummyData[1])
      expect(res.requestId).toBe('3')
    })
  })

  describe('mutator', () => {
    const mutator = {
      update(id: string, value: string): void {
        const data = dummyData.find((d) => d.id === id)
        if (data) {
          data.value = value
        }
      },
    }

    beforeEach(() => {
      connectWsServer({
        resolver: {},
        mutator,
        server: mockServer,
      })
    })

    it('mutates a value with a mutator method', async () => {
      const ws = mockServer.connectClient()

      ws.send({
        type: 'mutator:update',
        args: ['2', 'updated'],
        requestId: '1',
      })

      await Promise.resolve()

      expect(ws.received.length).toBe(1)
      const res = ws.received[0]

      expect(res.type).toBe('mutator:update')
      expect(res.requestId).toBe('1')

      expect(dummyData[1]).toEqual({
        id: '2',
        value: 'updated',
      })
    })
  })
})
