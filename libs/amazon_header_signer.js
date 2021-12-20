const moment = require('moment')
const {v4: uuidv4} = require('uuid');
const sha256 = require('fast-sha256')
const URL = require('url-parse')
const nacl = require('tweetnacl')
nacl.util = require('tweetnacl-util')

exports.sign = function sign(url, method, headers) {
  const token = headers['x-amz-access-token']
  const time = /*headers['x-amz-date']*/ moment().utc().format('YYYYMMDD[T]HHmmss[Z]')
  const requestId = /*headers['x-amzn-requestid'] */ uuidv4()
  const host = new URL(url).hostname
  const canonicalPath = new URL(url).pathname

  var filteredHeaders = {
    'host': host,
    'x-amz-access-token': token,
    'x-amz-date': time,
    'x-amzn-requestid': requestId
  }
  headers['Host'] = host
  headers['X-Amz-Date'] = time
  headers['X-Amzn-RequestId'] = requestId
  headers['X-Flex-Client-Time'] = /*headers['x-flex-client-time']*/ moment().format('x')

  const canonicalRequest = getCanonicalRequest(method, host, canonicalPath, filteredHeaders, time)
  const stringToSign = getStringToSign(canonicalRequest[0], time)
  const secret = reverseString(token)

  const r = [1,2,3,4]
  r[0] = 'RABBIT' + secret
  r[1] = time.substr(0, 8)
  r[2] = 'rabbit_request'
  r[3] = stringToSign

  const signedHexString = signSequenceString(r)
  const authHeader = 'RABBIT3-HMAC-SHA256 SignedHeaders='+ canonicalRequest[1] + ',Signature=' + signedHexString

  headers['Authorization'] = authHeader
  return authHeader
}

function getCanonicalRequest(method, host, canonicalPath, headers, time) {
  const signedHeaders = getSignedHeaderString(headers)
  const canonicalHeaderString = getCanonicalHeaderString(headers)
  const first = method + '\n' + canonicalPath + '\n' + canonicalHeaderString + '\n' + signedHeaders
  const second = signedHeaders
  return [first, second]
}

function getSignedHeaderString(headers) {
  return Object.keys(headers).map(key => key.toLocaleLowerCase()).join(';')
}

function getCanonicalHeaderString(headers) {
  var result = ''
  for (var key in headers) {
    result += key.toLocaleLowerCase() + ':' + headers[key] + '\n'
  }
  return result
}

function getStringToSign(canonicalRequest, time) {
  return 'RABBIT3-HMAC-SHA256\n' + time + '\n' + hexSha256(canonicalRequest)
}

function hexSha256 (str) {
  const uint8Str = nacl.util.decodeUTF8(str)
  const result = sha256(uint8Str)
  return byteToHexString(result).toLocaleLowerCase()
}

function signSequenceString(arr) {
  var key = null
  arr.forEach((row) => {
    if (key === null) {
      key = nacl.util.decodeUTF8(row)
      return
    }
    else {
      data = nacl.util.decodeUTF8(row)
      key = hmacSha256(data, key)
    }
  })
  const hexKey = byteToHexString(key).toLocaleLowerCase()
  return hexKey
}

function hmacSha256(data, key) {
  const hasher = new sha256.HMAC(key)
  hasher.update(data)
  return hasher.digest()
}

function reverseString(str) {
    return str.split('').reverse().join('');
}

function byteToHexString(uint8arr) {
  if (!uint8arr) {
    return '';
  }

  var hexStr = '';
  for (var i = 0; i < uint8arr.length; i++) {
    var hex = (uint8arr[i] & 0xff).toString(16);
    hex = (hex.length === 1) ? '0' + hex : hex;
    hexStr += hex;
  }

  return hexStr.toUpperCase();
}

function hexStringToByte(str) {
  if (!str) {
    return new Uint8Array();
  }

  var a = [];
  for (var i = 0, len = str.length; i < len; i+=2) {
    a.push(parseInt(str.substr(i,2),16));
  }

  return new Uint8Array(a);
}

function test () {
  var url = 'https://flex-capacity-na.amazon.com/GetOffersForProvider'
  var method = 'GET'
  var headers = {
    'x-amz-access-token': 'Atna|---Ad4dC8EyiD-MAahVWXVXUg5_J_z-6kAER7wTAbEEbFvT-alVxps8i5MQ3HsDg66KGqd0bJUt4_pdkwPTYE2RxhhCrg8i4n-pPeJ7SuuQxKPWVQ',
    'x-flex-client-time': 1553216609602,
    'x-amzn-requestid': 'd8635bf6-f46f-46ee-9de2-231dfa3bc0a8',
    'x-amz-date': '20190321T180329Z',
    'host': 'flex-capacity-na.amazon.com'
  }
  exports.sign(url, method, headers)
  console.log(headers)
}

//test()
