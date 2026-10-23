declare module 'moment-timezone' {
  import moment from 'moment'
  const timezone: typeof moment & {
    tz: {
      (text: string, format: string, strict: boolean, zone: string): moment.Moment
      (date: Date, zone: string): moment.Moment
    }
  }
  export default timezone
}
