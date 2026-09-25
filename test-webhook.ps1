$payload = @{
    object = "whatsapp_business_account"
    entry = @(
        @{
            id = "test_entry"
            changes = @(
                @{
                    value = @{
                        messaging_product = "whatsapp"
                        metadata = @{
                            display_phone_number = "1234567890"
                            phone_number_id = "test_phone_id"
                        }
                        contacts = @(
                            @{
                                profile = @{
                                    name = "Test Customer"
                                }
                                wa_id = "919952374972"
                            }
                        )
                        messages = @(
                            @{
                                from = "919952374972"
                                id = "wamid_" + [guid]::NewGuid().ToString().Substring(0,8)
                                timestamp = [Math]::Floor([datetimeOffset]::UtcNow.ToUnixTimeSeconds())
                                type = "text"
                                text = @{
                                    body = "Pentacloud"
                                }
                            }
                        )
                    }
                    field = "messages"
                }
            )
        }
    )
}

$jsonPayload = $payload | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/api/webhook" -Method Post -Body $jsonPayload -ContentType "application/json"
Write-Host "Webhook simulated successfully! Check your localhost UI."
