export class AmadeusService {
    private static token: string | null = null
    private static tokenExpiresAt: number = 0

    static async getAccessToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiresAt) {
            return this.token
        }

        const clientId = process.env.AMADEUS_CLIENT_ID
        const clientSecret = process.env.AMADEUS_CLIENT_SECRET

        if (!clientId || !clientSecret) {
            throw new Error('Amadeus API credentials missing')
        }

        const response = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`
        })

        if (!response.ok) {
            throw new Error('Failed to get Amadeus access token')
        }

        const data = await response.json()
        this.token = data.access_token
        this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000
        return this.token!
    }
}
