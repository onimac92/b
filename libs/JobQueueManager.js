function JobQueueManager() {
  this.queue = []
  this.loopInterval = -1
}

JobQueueManager.prototype.start = async function () {
  if (this.loopInterval == -1) {
    this.loopInterval = setInterval(this.loop.bind(this), 10)
  } else {
    throw new Error('Loop already started')
  }

}

JobQueueManager.prototype.stop = function () {
  if (this.loopInterval >= 0) {
    clearInterval(this.loopInterval)
    this.loopInterval = -1
  }
}

JobQueueManager.prototype.loop = async function () {
  if (this.queue.length <= 0) {
    return
  }
  const job = this.queue.shift()
  await job.executor.call()
}

/* priority: smaller is more priority */
JobQueueManager.prototype.push = function (executor, priority=10) {
  this.queue.push({
    executor: executor,
    priority: priority,
    age: Date.now()
  })
  this.queue.sort((jobA, jobB) => {
    if (jobA.priority == jobB.priority) {
      return jobA.age - jobB.age
    } else {
      return jobA.priority - jobB.priority
    }
  })
}

if (typeof(module) === 'object') {
	module.exports = JobQueueManager;
}
