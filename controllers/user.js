async function login(req, res) {
  const User = req.db.User;

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user || !(await user.validPassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    else if (user.isTerminated) {  // 被停權的話也要擋下來
      return res.status(403).json({error: 'terminated account'});
    }
    const token = user.generateToken();
    const userWithoutPassword = removeUserPassword(user);
    res.json({ token, ...userWithoutPassword });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function register(req, res) {
  const User = req.db.User;

  const { email, password, name, phone } = req.body;
  const permission = "customer";
  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser){
      return res.status(400).json({ error: 'Email already in use' });
    }
    const newUser = await User.create({ name, phone, email, password, permission });
    const token = newUser.generateToken();
    const returnedUser = removeUserPassword(newUser);
    res.status(201).json({ token, ...returnedUser });
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
}

function removeUserPassword(user) {
  const userAttributes = user.get({ plain: true });
  const { password, createdAt, updatedAt, ...userWithoutPassword } = userAttributes;
  return userWithoutPassword;
}

module.exports = { 
  login, 
  register 
};