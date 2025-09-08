import fetch from "node-fetch";

export async function handler(event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const { username, password } = JSON.parse(event.body);

  if (!username || !password) {
    return { statusCode: 400, body: "Missing fields" };
  }

  const repoOwner = "KebinCo";
  const repoName = "fuzzy-goggles";
  const filePath = "users.json";

  const token = process.env.GITHUB_TOKEN;

  // 1. Get existing users.json
  const res = await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
    {
      headers: { Authorization: `token ${token}` }
    }
  );
  const data = await res.json();
  const content = Buffer.from(data.content, "base64").toString();
  const users = JSON.parse(content);

  // 2. Add new user
  users.push({ username, password }); // (later: we’ll hash password)

  const updatedContent = Buffer.from(JSON.stringify(users, null, 2)).toString("base64");

  // 3. Commit back to GitHub
  await fetch(
    `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
    {
      method: "PUT",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: `Add user ${username}`,
        content: updatedContent,
        sha: data.sha
      })
    }
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "User registered" })
  };
}
