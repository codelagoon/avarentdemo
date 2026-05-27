import modal

# Define the Modal app – this name must be unique in your Modal account
app = modal.App("avarent-gan-trainer")

# The function that will be exposed via HTTP. Use snake_case arguments
@app.function()
def train_gan(epochs: int, privacy_budget: float, quality: float):
    """Simple placeholder GAN‑training function.
    Replace the body with your real training logic (PyTorch, TensorFlow, etc.).
    The return value must be JSON‑serialisable – Modal will automatically
    convert the dict to JSON for the HTTP response.
    """
    # Simulate some work – you can remove this in production
    import time
    time.sleep(1.5)

    # Dummy metrics – replace with actual results from your training run
    return {
        "status": "complete",
        "epochs": epochs,
        "privacyBudget": privacy_budget,
        "quality": quality,
        "wassersteinDistance": 0.042,
        "fidScore": 12.8,
        "syntheticProfilesGenerated": 2460,
    }

# HTTP handler – forwards JSON payload to train_gan and returns its result
@app.web_endpoint()
def train_gan_http(request):
    data = request.json()
    result = train_gan.remote(**data)
    return result

# Optional local entrypoint – handy for quick dev testing
@app.local_entrypoint()
def main():
    print("Running a local test of train_gan …")
    result = train_gan.remote(epochs=3, privacy_budget=1, quality=0.9)
    print("Result →", result)
