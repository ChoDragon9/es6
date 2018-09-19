const {
  isString,
  isObject,
  isReference,
  isNumber,
  isBoolean,
  isNull,
} = require('./helper')
const {
  createNode,
  getBackword,
  getValue,
  setValue
} = require('./pointer')

const parser = input => {
  input = input.trim()
  let i = 0
  const j = input.length
  let pointer = createNode({})
  while (i < j) {
    let cursor = i
    const cursorStr = input[cursor]
    if (isReference(cursorStr)) {
      pointer = parseReference(cursorStr, pointer)
    } else {
      let val
      switch (true) {
        case isString(cursorStr):
          [cursor, val] = parseString(input, cursor)
          break;
        case isNumber(cursorStr):
          [cursor, val] = parseNumber(input, cursor)
          break;
        case isBoolean(cursorStr):
          [cursor, val] = parseBoolean(input, cursor)
          break;
        case isNull(cursorStr):
          [cursor, val] = parseNull(cursor)
          break;
      }
      if (typeof val !== 'undefined') {
        setValue(pointer, val)
      }
    }
    i = cursor + 1
  }
  return getValue(pointer)
}

const parseString = (input, cursor) => {
  const newCursor = findEndString(input, cursor)
  const str = input.substring(cursor + 1, newCursor)
  return [newCursor, str]
}

const findEndString = (input, cursor) => {
  let newCursor = findString(input, cursor)
  while (input[newCursor - 1] === `\\`) {
    newCursor = findString(input, newCursor)
  }
  return newCursor
}

const findString = (input, cursor) => input.indexOf(`"`, cursor + 1)

const parseNumber = (input, cursor) => {
  const nearCursor = findEndNumber(input, cursor)
  const newCursor = nearCursor - 1
  let num = input.substring(cursor, nearCursor).trim()
  num = parseFloat(num)
  return [newCursor, num]
}

const findEndNumber = (input, cursor) => {
  const nextCursor = cursor + 1
  const commaIdx = input.indexOf(`,`, nextCursor)
  const arrIdx = input.indexOf(`]`, nextCursor)
  const objIdx = input.indexOf(`}`, nextCursor)
  const nearCursor = Math.min(...[commaIdx, arrIdx, objIdx].filter(v => v > -1))
  return nearCursor
}

const parseBoolean = (input, cursor) => {
  const isTrue = input[cursor] === 't'
  const val = isTrue ? true : false
  const newCursor = cursor + (isTrue ? 3 : 4)
  return [newCursor, val]
}

const parseNull = (cursor) => {
  const val = null
  const newCursor = cursor + 3
  return [newCursor, val]
}

const parseReference = (cursorStr, pointer) => {
  let newPointer
  const delimiter = isObject(cursorStr) ? `{` : `[`
  if (cursorStr === delimiter) {
    const val = isObject(cursorStr) ? {} : []
    setValue(pointer, val)
    newPointer = createNode({ val, back: pointer })
  } else {
    newPointer = getBackword(pointer)
  }
  return newPointer
}

module.exports = { parser }