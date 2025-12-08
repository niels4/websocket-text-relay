export class EventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, listener) {
    let eventSubscribers = this.events.get(event)
    if (!eventSubscribers) {
      eventSubscribers = new Set()
      this.events.set(event, eventSubscribers)
    }
    eventSubscribers.add(listener)
    return () => this.removeListener(event, listener)
  }

  removeListener(event, listener) {
    const eventSubscribers = this.events.get(event)
    if (!eventSubscribers) {
      return
    }
    if (!listener) {
      this.events.delete(event)
      return
    }
    eventSubscribers.delete(listener)
  }

  emit(event, ...args) {
    const eventSubscribers = this.events.get(event)
    if (!eventSubscribers) {
      return
    }
    for (const listener of eventSubscribers) {
      listener.apply(this, args)
    }
  }

  once(event, listener) {
    const remove = this.on(event, (...args) => {
      remove()
      listener.apply(this, args)
    })
  }
}

// make compatible with functions that handle DOM event targets
EventEmitter.prototype.addEventListener = EventEmitter.prototype.on
EventEmitter.prototype.removeEventListener = EventEmitter.prototype.removeListener
