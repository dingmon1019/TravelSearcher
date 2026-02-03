export class AmadeusService {
    private static token: string | null = null
    private static tokenExpiresAt: number = 0

    static async getAccessToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token
        }

        const clientId = process.env.AMADEUS_CLIENT_ID
        const clientSecret = process.env.AMADEUS_CLIENT_SECRET
        const isProd = process.env.AMADEUS_ENV === 'production'
        const authUrl = isProd
            ? 'https://api.amadeus.com/v1/security/oauth2/token'
            : 'https://test.api.amadeus.com/v1/security/oauth2/token'

        console.log(`[AmadeusService] Requesting token from ${authUrl}. ClientID present: ${!!clientId}`)

        if (!clientId || !clientSecret) {
            console.error('[AmadeusService] Amadeus API credentials missing (AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET)');
            throw new Error('Amadeus API credentials missing');
        }

        try {
            const response = await fetch(authUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`[AmadeusService] Token Error ${response.status}:`, JSON.stringify(errorData))
                throw new Error(`Failed to get Amadeus access token: ${response.status}`)
            }

            const data = await response.json()
            this.token = data.access_token
            this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
            console.log(`[AmadeusService] Token acquired successfully. Expires in ${data.expires_in}s`)
            return this.token!
        } catch (error) {
            console.error('[AmadeusService] Token acquisition failed:', error)
            throw error
        }
    }
}
