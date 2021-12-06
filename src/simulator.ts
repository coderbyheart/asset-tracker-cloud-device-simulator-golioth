import chalk from 'chalk'
import {
	uiServer,
	WebSocketConnection,
} from '@nordicsemiconductor/asset-tracker-cloud-device-ui-server'
import { deviceTopics } from './deviceTopics.js'
import { defaultConfig } from './defaultConfig.js'
import { connect } from './connect.js'

const cellId = process.env.CELL_ID
const endpoint = process.env.MQTT_ENDPOINT ?? 'mqtt.golioth.io'

export const simulator = async (): Promise<void> => {
	const pskIdentity = process.argv[process.argv.length - 2]
	const psk = process.argv[process.argv.length - 1]

	console.error(chalk.magenta('endpoint:'), chalk.yellow(endpoint))
	console.error(chalk.magenta('pskIdentity:'), chalk.yellow(pskIdentity))

	const client = await connect({
		psk,
		pskIdentity,
		host: endpoint,
	})

	const version = '1.0.0'

	const devRoam = {
		dev: {
			v: {
				band: 666,
				nw: 'LAN',
				modV: 'device-simulator',
				brdV: 'device-simulator',
				iccid: '12345678901234567890',
			},
			ts: Date.now(),
		},
		roam: {
			v: {
				rsrp: 70,
				area: 30401,
				mccmnc: 24201,
				cell: cellId === undefined ? 16964098 : parseInt(cellId, 10),
				ip: '0.0.0.0',
			},
			ts: Date.now(),
		},
	} as const

	let cfg = {
		...defaultConfig,
	}

	let wsConnection: WebSocketConnection
	const wsNotify = (message: Record<string, any>) => {
		if (wsConnection !== undefined) {
			console.log(chalk.magenta('[ws>'), JSON.stringify(message))
			wsConnection.send(JSON.stringify(message))
		} else {
			console.warn(chalk.red('Websocket not connected.'))
		}
	}

	const sendConfigToUi = () => {
		if (wsConnection !== undefined) {
			console.log(chalk.magenta('[ws>'), JSON.stringify(cfg))
			wsNotify({ config: cfg })
		}
	}

	const updateLightDbReported = (update: { [key: string]: any }) => {
		const topic = deviceTopics.lightDb('reported')
		console.log(chalk.magenta('>'), topic, chalk.cyan(JSON.stringify(update)))
		client.publish(topic, JSON.stringify(update))
	}

	const updateLightDbReportedStream = (
		update: Record<string, { v: any; ts: number }[]>,
	) => {
		Object.entries(update).forEach(([key, updates]) => {
			client.publish(
				deviceTopics.lightDbSteam(`reported/${key}`),
				updates.map((u) => JSON.stringify(u)).join('\n'),
			)
		})
	}

	const updateConfig = (updateConfig: { [key: string]: any }) => {
		cfg = {
			...cfg,
			...updateConfig,
		}
		console.log(chalk.blue('Config:'))
		console.log(cfg)
		updateLightDbReported({ cfg, ...devRoam })
		sendConfigToUi()
	}

	const reportCurrentFirmware = () => {
		const topic = deviceTopics.fota.report({ package: 'app' })
		const update = {
			state: 0, // Idle
			reason: 0, // ready state
			version,
			target: 'device-simulator',
		}
		console.log(chalk.magenta('>'), topic, chalk.cyan(JSON.stringify(update)))
		client.publish(topic, JSON.stringify(update))
	}

	const messageHandler = (topic: string) => (message: string, path: string) => {
		console.log(chalk.magenta('[ws<'), JSON.stringify({ message, path }))
		console.log(
			chalk.magenta('<'),
			chalk.blue.blueBright(topic),
			chalk.cyan(message),
		)
		client.publish(topic, message)
	}

	/**
	 * Simulate the FOTA process
	 * @see https://docs.golioth.io/reference/protocols/mqtt/ota#release-manifest-format
	 */
	const simulateFota = ({
		components,
	}: {
		sequenceNumber: number
		hash: string
		components: {
			package: string
			version: string
			hash: string
			size: number
			uri: string
			type: string
		}[]
	}) => {
		components.map(({ version, uri }) => {
			const update = {
				state: 1, // Downloading
				reason: 0, // ready state
				version: version,
				target: 'device-simulator',
			}
			console.log(chalk.magenta('>'), uri, chalk.cyan(JSON.stringify(update)))
			client.publish(uri, JSON.stringify(update))
		})

		setTimeout(() => {
			reportCurrentFirmware()
		}, 10 * 1000)
	}

	const port = await uiServer({
		deviceId: pskIdentity,
		onUpdate: updateLightDbReported,
		onSensorMessage: (message) => {
			updateLightDbReported(message)
		},
		onBatch: (update) => {
			updateLightDbReportedStream(update)
		},
		onWsConnection: (c) => {
			console.log(chalk.magenta('[ws]'), chalk.cyan('connected'))
			wsConnection = c
			sendConfigToUi()
		},
		onMessage: {
			'/pgps/get': messageHandler(deviceTopics.lightDb('pgps/get')),
			'/agps/get': messageHandler(deviceTopics.lightDb('agps/get')),
			'/ncellmeas': messageHandler(deviceTopics.lightDb('ncellmeas')),
		},
	})

	console.log()
	console.log(
		'',
		chalk.yellowBright(
			`To control this device use this endpoint in the device simulator UI:`,
		),
		chalk.blueBright(`http://localhost:${port}`),
	)
	console.log()

	client.on('message', (topic, payload) => {
		console.log(chalk.magenta('<'), chalk.yellow(topic))
		if (payload.length) {
			console.log(chalk.magenta('<'), chalk.cyan(payload.toString()))
		}
		// Handle desired updates
		if (topic === deviceTopics.lightDb('desired')) {
			const desiredUpdate = JSON.parse(payload.toString())
			if (desiredUpdate?.cfg !== undefined) {
				updateConfig(desiredUpdate.cfg)
			}
			return
		}
		// Handle FOTA
		if (topic === deviceTopics.fota.desired()) {
			simulateFota(JSON.parse(payload.toString()))
			return
		}

		wsNotify({ message: { topic, payload: payload.toString() } })
	})

	client.on('error', (err) => {
		console.error(chalk.red(err.message))
	})

	// Subscribe to interesting topics
	const subscribe = (topic: string) => {
		console.log(chalk.magenta('<+'), chalk.yellow(topic))
	}
	// Changes to desired state
	subscribe(deviceTopics.lightDb('desired'))
	// FOTA
	subscribe(deviceTopics.fota.desired())

	// Report current config
	updateLightDbReported({ cfg, ...devRoam })
	reportCurrentFirmware()
}
