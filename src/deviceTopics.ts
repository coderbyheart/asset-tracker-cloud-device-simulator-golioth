export const deviceTopics = {
	// See https://docs.golioth.io/reference/protocols/mqtt/lightdb
	lightDb: (path?: string): string => `/.d/${path}`,
	// See https://docs.golioth.io/reference/protocols/mqtt/lightdb-stream
	lightDbSteam: (path?: string): string => `/.s/${path}`,
	// FOTA. See https://docs.golioth.io/reference/protocols/mqtt/ota
	fota: {
		// Get desired release version in Manifest Format
		desired: (): string => '/.u/desired',
		// Download binary of a given component and version
		download: ({
			package: p,
			version,
		}: {
			package: 'string'
			version: string
		}): string => `/.u/c/${p}@${version}`,
		// Report firmware state for a given package
		report: ({ package: p }: { package: string }): string => `/.u/c/${p}`,
	},
	// See https://docs.golioth.io/reference/protocols/mqtt/logging
	logs: (): string => '/logs',
}
