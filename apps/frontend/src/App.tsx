import { authClient } from "./lib/auth";

function App() {
  async function signup() {
    const email = crypto.randomUUID() + "@example.com";

    console.log(email);

    const res = await authClient.signUp.email({
      name: "Manas",

      email,

      password: "password123",
    });

    console.log(res);
  }

  return (
    <div>
      <button onClick={signup}>Signup</button>
    </div>
  );
}

export default App;
