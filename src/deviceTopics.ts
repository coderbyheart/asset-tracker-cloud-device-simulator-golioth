export const deviceTopics = {
	/**
	 * Subscribe to read persisted data
	 * Publish to reate/update data
	 * Publish empty body to delete data
	 * @see https://docs.golioth.io/reference/protocols/mqtt/lightdb
	 */
	lightDb: (path?: string[]): string => `.d/${path?.join('/')}`,
	/**
	 * Subscribe to get latest data
	 * Publish to send data
	 * @see https://docs.golioth.io/reference/protocols/mqtt/lightdb-stream
	 */
	lightDbStream: (path?: string[]): string => `.s/${path?.join('/')}`,
	/**
	 * @see https://docs.golioth.io/reference/protocols/mqtt/ota
	 */
	fota: {
		/**
		 * Subscribe to get desired release version in manifest Format
		 */
		desired: (): string => '.u/desired',
		/**
		 * Subscribe to download binary of a given component and version
		 */
		download: ({
			package: p,
			version,
		}: {
			package: 'string'
			version: string
		}): string => `.u/c/${p}@${version}`,
		/**
		 * Publish to report firmware state for a given package
		 */
		report: ({ package: p }: { package: string }): string => `.u/c/${p}`,
	},
	/**
	 * Publish to send logs
	 * @see https://docs.golioth.io/reference/protocols/mqtt/logging
	 */
	logs: (): string => 'logs',
}
