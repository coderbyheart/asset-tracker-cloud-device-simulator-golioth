import chalk from 'chalk'
import mqtt from 'mqtt'

export const connect = async ({
	pskIdentity,
	psk,
	host,
}: {
	pskIdentity: string
	psk: string
	host: string
}): Promise<mqtt.MqttClient> =>
	new Promise((resolve) => {
		console.log(chalk.magenta('Connecting ...'))

		const client = mqtt.connect({
			username: pskIdentity,
			password: psk,
			host,
			port: 8883,
			rejectUnauthorized: true,
			clientId: pskIdentity,
			protocol: 'mqtts',
			version: 4,
		})

		client.on('connect', () => {
			console.log(chalk.green('Connected'))
			resolve(client)
		})
	})
