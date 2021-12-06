#!/usr/bin/env node

import chalk from 'chalk'
import { simulator } from './dist/simulator.js'

const die = (err) => {
	console.error(chalk.red(`An unhandled exception occured!`))
	console.error(chalk.red(err.message))
	process.exit(1)
}

process.on('uncaughtException', die)
process.on('unhandledRejection', die)

simulator()
