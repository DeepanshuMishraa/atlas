import axios from "axios";


export const api = axios.create({
  baseURL: "http://localhost:8081",
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
  timeout: 10000,
})
