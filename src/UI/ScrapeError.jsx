import React from 'react'
import { BreakingPre } from './BreakingPre'
import * as errors from '../errors'

function stripErrorCode (error) {
  return error.message.replace(/^\[[A-Z]{3}] /, '')
}

function cleanStack (error) {
  const messagePrefix = stripErrorCode(error) + '\n'

  const stack = error.stack.replace(/^Error: /, '')
  return stack.startsWith(messagePrefix) ? stack.slice(messagePrefix.length) : stack
}

const Warn = ({children}) => {
  return <div>⚠️ {children}</div>
}

export const ScrapeError = ({ error }) => {
  const logIsNotImportant = error.allowRetry || error.allow_retry
  const forcePluginReinstall = error.fatal
  const stack = cleanStack( error)

  return (
    <div>
      <h3>Scrape Error</h3>
      {error.name === 'Error' && <Warn>This error message will never be displayed on production UI; if you intend to show meaningful message to user, use one of constructors:
        <ul>
          {Object.keys(errors).map((key) => <li key={key}>{key}</li>)}
        </ul>
      </Warn>}
      {logIsNotImportant && <Warn>logIsNotImportant = true: This error will be displayed on production UI without [Send log] button</Warn>}
      {forcePluginReinstall && <Warn>forcePluginReinstall = true: User will be forced into preferences screen after this error</Warn>}
      <BreakingPre>{error.message || 'error.message n/a'}</BreakingPre>
      <BreakingPre>{stack}</BreakingPre>
    </div>
  )
}
