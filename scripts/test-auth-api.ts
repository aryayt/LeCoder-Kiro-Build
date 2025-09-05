// Test Better Auth API endpoints directly
async function testAuthAPI() {
  console.log("🧪 Testing Better Auth API...");

  try {
    // Test if the auth API is responding
    console.log("1. Testing auth API availability...");
    const healthResponse = await fetch("http://localhost:3000/api/auth", {
      method: "GET",
    });
    console.log("Health check status:", healthResponse.status);

    // Test sign-up endpoint
    console.log("\n2. Testing sign-up endpoint...");
    const signUpResponse = await fetch("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test-debug@example.com",
        password: "TestPassword123",
        name: "Test User",
      }),
    });

    console.log("Sign-up status:", signUpResponse.status);
    console.log("Sign-up headers:", Object.fromEntries(signUpResponse.headers.entries()));
    
    const signUpText = await signUpResponse.text();
    console.log("Sign-up response:", signUpText);

    // Test sign-in endpoint
    console.log("\n3. Testing sign-in endpoint...");
    const signInResponse = await fetch("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "aryatest1@gmail.com",
        password: "Aryateja@5",
      }),
    });

    console.log("Sign-in status:", signInResponse.status);
    const signInText = await signInResponse.text();
    console.log("Sign-in response:", signInText);

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testAuthAPI();