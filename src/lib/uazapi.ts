import axios from 'axios'

const BASE_URL = process.env.NEXT_PUBLIC_UAZAPI_URL?.replace(/\/$/, '')
const ADMIN_TOKEN = process.env.NEXT_PUBLIC_UAZAPI_ADMIN_TOKEN

const uazapi = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
})

export interface UazapiInstance {
  name: string
  token: string
  status: 'connected' | 'disconnected' | 'connecting' | string
  number?: string
  qrcode?: string
}

export const createInstance = async (name: string) => {
  const response = await uazapi.post('/instance/init', {
    name,
    systemName: 'fluxo-digital',
    fingerprintProfile: 'chrome',
    browser: 'chrome'
  }, {
    headers: { 'admintoken': ADMIN_TOKEN }
  })
  return response.data // Should contain { token }
}

export const getQRCode = async (instanceToken: string) => {
  const response = await uazapi.post('/instance/connect', {}, {
    headers: { 'token': instanceToken }
  })
  return response.data // Should contain { qrcode: 'base64...' }
}

export const getInstanceStatus = async (instanceToken: string) => {
  const response = await uazapi.get('/instance/status', {
    headers: { 'token': instanceToken }
  })
  return response.data // Contains state, qrcode, etc.
}

export const deleteInstance = async (instanceToken: string) => {
  const response = await uazapi.delete('/instance', {
    headers: { 'token': instanceToken }
  })
  return response.data
}

export const listAllInstances = async () => {
  const response = await uazapi.get('/instance/all', {
    headers: { 'admintoken': ADMIN_TOKEN }
  })
  return response.data // Array of instances
}

export default uazapi
