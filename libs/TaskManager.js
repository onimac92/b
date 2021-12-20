function TaskManager() {
  const defaultStartAfter = TaskManager.INVALID_VALUE
  const defaultInterval = TaskManager.INVALID_VALUE

  this.startAfter = defaultStartAfter
  this.interval = defaultInterval
  this.runNow = false
  this.timeoutId = null
  this.intervalId = null
  this.task = null
  this.taskName = null
}

TaskManager.TaskRecordList = {}
TaskManager.INVALID_VALUE = NaN

TaskManager.prototype.after = function (miliseconds) {
  this.startAfter = miliseconds
  return this
}

TaskManager.prototype.every = function (miliseconds) {
  this.interval = miliseconds
  return this
}

TaskManager.prototype.immediately = function () {
  this.runNow = true
  return this
}

TaskManager.prototype.clear = function () {
  if (this.timeoutId) {
    clearTimeout(this.timeoutId)
  }
  if (this.intervalId) {
    clearInterval(this.intervalId)
  }
  if (TaskManager.TaskRecordList[this.taskName]) {
    delete TaskManager.TaskRecordList[this.taskName]
  }
}

TaskManager.prototype.schedule = async function (taskName, task, parameters = []) {

  if (isNaN(this.startAfter) && isNaN(this.interval)) {
    throw new Error(`Cannot schedule '${taskName}' task due to lack of 'every' call or 'after' call`)
  }
  if (TaskManager.TaskRecordList[taskName]) {
    //reschedule task
    const currentTask = TaskManager.TaskRecordList[taskName]
    currentTask.clear()
  }
  const taskRecord = TaskManager.TaskRecordList[taskName] = this
  taskRecord.taskName = taskName
  taskRecord.task = task

  if (!isNaN(this.startAfter)) {
    taskRecord.timeoutId = setTimeout( async () => {
      if (!isNaN(this.interval)) {
        taskRecord.intervalId = setInterval(task.bind(taskRecord, ...parameters), taskRecord.interval)
      } else {
        await task.apply(taskRecord, parameters)
      }
    }, taskRecord.startAfter)
  } else {
    if (!isNaN(taskRecord.interval)) {
      taskRecord.intervalId = setInterval(task.bind(taskRecord, ...parameters), taskRecord.interval)
      if (taskRecord.runNow) {
        await task.apply(taskRecord, parameters)
      }
    }
  }
}

TaskManager.after = function (miliseconds) {
  const instance = new TaskManager()
  return instance.after(miliseconds)
}

TaskManager.every = function (miliseconds) {
  const instance = new TaskManager()
  return instance.every(miliseconds)
}

TaskManager.immediately = function () {
  const instance = new TaskManager()
  return instance.immediately()
}

TaskManager.clear = function (taskName) {
  const taskRecord = TaskManager.TaskRecordList[taskName]
  if (taskRecord) {
    taskRecord.clear()
  }
}
TaskManager.isExists = function (taskName) {
  return Boolean(TaskManager.TaskRecordList[taskName])
}

if (typeof(module) === 'object') {
	module.exports = TaskManager;
}
