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
const {
  step,
  not,
  isUndefined,
  trim,
  dispatch
} = require('./fp')

const parser = input => {
  input = trim(input)
  let pointer = createNode({})
  step(input, ({cursor, index, str}) => {
    if (isReference(cursor)) {
      pointer = parseReference(cursor, pointer)
    } else {
      const result = extract({cursor, index, str})
      if (result) {
        const [index, val] = result
        if (not(isUndefined(val))) {
          setValue(pointer, val)
        }
        return index + 1
      }
    }
  })
  return getValue(pointer)
}

const extract = dispatch(
  ({cursor, index, str}) => isString(cursor) ? extractString(str, index) : undefined,
  ({cursor, index, str}) => isNumber(cursor) ? extractNumber(str, index) : undefined,
  ({cursor, index, str}) => isBoolean(cursor) ? extractBoolean(str, index) : undefined,
  ({cursor, index}) => isNull(cursor) ? extractNull(index) : undefined
)

const extractString = (inputStr, index) => {
  const newCursor = findEndString(inputStr, index)
  const str = inputStr.substring(index + 1, newCursor)
  return [newCursor, str]
}

const findEndString = (inputStr, index) => {
  let newCursor = findString(inputStr, index)
  while (inputStr[newCursor - 1] === `\\`) {
    newCursor = findString(inputStr, newCursor)
  }
  return newCursor
}

const findString = (str, index) => str.indexOf(`"`, index + 1)

const extractNumber = (str, index) => {
  const nearCursor = findEndNumber(str, index)
  const newCursor = nearCursor - 1
  let num = trim(str.substring(index, nearCursor))
  num = parseFloat(num)
  return [newCursor, num]
}

const findEndNumber = (str, index) => {
  const nextCursor = index + 1
  const commaIdx = str.indexOf(`,`, nextCursor)
  const arrIdx = str.indexOf(`]`, nextCursor)
  const objIdx = str.indexOf(`}`, nextCursor)
  const nearCursor = Math.min(...[commaIdx, arrIdx, objIdx].filter(v => v > -1))
  return nearCursor
}

const extractBoolean = (str, index) => {
  const isTrue = str[index] === 't'
  const val = isTrue ? true : false
  const newCursor = index + (isTrue ? 3 : 4)
  return [newCursor, val]
}

const extractNull = (index) => {
  const val = null
  const newCursor = index + 3
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