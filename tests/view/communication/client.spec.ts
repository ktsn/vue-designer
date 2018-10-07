import {
  CommunicationClient,
  CommunicationClientObserver
} from '@/view/communication/client'
import { MockWebSocketClient } from '../../helpers/ws'

describe('CommunicationClient', () => {
  class Foo {
    constructor(public id: number, public value: string) {}
  }

  const resolver = {
    get(id: number): Foo | undefined {
      return dummyData.find(d => d.id === id)
    },

    all(): Foo[] {
      return dummyData
    }
  }

  const mutator = {
    update(id: number, value: string): Foo | undefined {
      const f = dummyData.find(d => d.id === id)
      if (!f) return
      f.value = value
      return f
    }
  }

  let dummyData: Foo[]
  let client: CommunicationClient<typeof resolver, typeof mutator>
  let mockWs: MockWebSocketClient

  beforeEach(() => {
    dummyData = [new Foo(1, 'foo'), new Foo(2, 'bar'), new Foo(3, 'baz')]
    mockWs = new MockWebSocketClient()
    client = new CommunicationClient({
      ws: mockWs
    })
  })

  describe('resolver', () => {
    it('fetches some data via resolve method', done => {
      client.resolve('get', 2).then(res => {
        expect(res).toEqual(dummyData[1])
        done()
      })

      // Test request payload
      expect(mockWs.sent.length).toBe(1)
      const p = mockWs.sent[0]
      expect(p.type).toBe('resolver:get')
      expect(p.args).toEqual([2])

      mockWs.receive({
        type: 'resolver:get',
        data: resolver.get(2),
        requestId: p.requestId
      })
    })

    it('does not react different request id', done => {
      client.resolve('get', 2).then(res => {
        expect(res).toEqual(dummyData[1])
        done()
      })

      const p = mockWs.sent[0]

      mockWs.receive({
        type: 'resolver:get',
        data: resolver.get(1),
        requestId: 'dummy id'
      })

      mockWs.receive({
        type: 'resolver:get',
        data: resolver.get(2),
        requestId: p.requestId
      })
    })
  })

  describe('mutator', () => {
    it('updates remote data via mutate method', done => {
      client.mutate('update', 2, 'updated').then(res => {
        expect(res).toEqual({
          id: 2,
          value: 'updated'
        })
        done()
      })

      // Test request payload
      expect(mockWs.sent.length).toBe(1)
      const p = mockWs.sent[0]
      expect(p.type).toBe('mutator:update')
      expect(p.args).toEqual([2, 'updated'])

      mockWs.receive({
        type: 'mutator:update',
        data: mutator.update(2, 'updated'),
        requestId: p.requestId
      })
    })

    it('does not react different request id', done => {
      client.mutate('update', 2, 'updated').then(res => {
        expect(res).toEqual({
          id: 2,
          value: 'updated'
        })
        done()
      })

      const p = mockWs.sent[0]

      mockWs.receive({
        type: 'mutator:update',
        data: mutator.update(1, 'test'),
        requestId: 'dummy id'
      })

      mockWs.receive({
        type: 'mutator:update',
        data: mutator.update(2, 'updated'),
        requestId: p.requestId
      })
    })
  })

  describe('subject', () => {
    let observer: Required<CommunicationClientObserver<Foo>>
    let unobserve: () => void
    beforeEach(() => {
      observer = {
        onAdd: jest.fn(),
        onUpdate: jest.fn(),
        onRemove: jest.fn()
      }
      unobserve = client.observe(observer)
    })

    afterEach(() => {
      unobserve()
    })

    it('observes add event', () => {
      const dummy = new Foo(4, 'new')

      mockWs.receive({
        type: 'subject:add',
        data: dummy
      })

      expect(observer.onAdd).toHaveBeenCalledWith(dummy)
    })

    it('observes update event', () => {
      const dummy = dummyData[1]

      mockWs.receive({
        type: 'subject:update',
        data: dummy
      })

      expect(observer.onUpdate).toHaveBeenCalledWith(dummy)
    })

    it('observes remove event', () => {
      const dummy = dummyData[0]

      mockWs.receive({
        type: 'subject:remove',
        data: dummy
      })

      expect(observer.onRemove).toHaveBeenCalledWith(dummy)
    })

    it('never call observer after unsubscribed', () => {
      const dummy = new Foo(4, 'new')
      unobserve()

      mockWs.receive({
        type: 'subject:add',
        data: dummy
      })

      expect(observer.onAdd).not.toHaveBeenCalled()
    })
  })
})
