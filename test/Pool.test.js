const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("Pool", function () {
  async function deployPoolFixture() {

    const [owner, caller] = await ethers.getSigners();

    const Stable = await ethers.getContractFactory("StableToken");
    const stable = await Stable.deploy();

    const PoolToken = await ethers.getContractFactory("PoolToken");
    const poolToken = await PoolToken.deploy();

    const Pool = await ethers.getContractFactory("Pool");
    const pool = await Pool.deploy(stable.address, poolToken.address);

    return { pool, stable, poolToken, owner, caller };
  }

  describe("Initialization: ", function() {
    it("Should init with correct args: ", async function () {
        const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);

        expect(await pool.stable()).to.equal(stable.address);
        expect(await pool.pToken()).to.equal(poolToken.address);
        
    });
  });

  describe("Deposit: ", function() {
    it("Should transfer correct amount", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
  
      await stable.mint(caller.address, amount);
      await stable.connect(caller).approve(pool.address, amount);
  
  
      await expect(() => pool.connect(caller).deposit(amount, stable.address)).to.changeTokenBalances(stable, [pool, caller], [amount, 0 - amount]);
    });
  
    it("Should mint correct amount", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
  
      await stable.mint(caller.address, amount);
      await stable.connect(caller).approve(pool.address, amount);
  
  
      await expect(() => pool.connect(caller).deposit(amount, stable.address)).to.changeTokenBalance(poolToken, caller, amount / 10);
      expect(await poolToken.totalSupply()).to.equal(amount / 10);
    });

    it("Should fail if amount not in range", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("10");
      await poolToken.grantMinter(pool.address);
  
      await stable.mint(caller.address, amount);
      await stable.connect(caller).approve(pool.address, amount);
  
      await expect(pool.connect(caller).deposit(amount, stable.address)).to.be.revertedWith("Pool: Amount not in range");
    });

    it("Should fail if not stable", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
  
      await stable.mint(caller.address, amount);
      await stable.connect(caller).approve(pool.address, amount);
  
      await expect(pool.connect(caller).deposit(amount, poolToken.address)).to.be.revertedWith("Pool: Not stable");
    });

    it("Should fail if not enough balance", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
  
      await stable.connect(caller).approve(pool.address, amount);
  
      await expect(pool.connect(caller).deposit(amount, stable.address)).to.be.revertedWith("Pool: Not enough balance");
    });

    it("Should fail if not enough allowance", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
      
      await stable.mint(caller.address, amount);
  
      await expect(pool.connect(caller).deposit(amount, stable.address)).to.be.revertedWith("Pool: Not enough allowance");
    });
  });

  describe("Withdraw: ", function() {
    it("Should transfer correct amount", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
  
      await stable.mint(caller.address, amount);
      await stable.connect(caller).approve(pool.address, amount);

      await pool.connect(caller).deposit(amount, stable.address);

      await pool.money();
  
      await expect(() => pool.connect(caller).withdraw(amount)).to.changeTokenBalances(stable, [pool, caller], [0 - 1100, 1100]);
    });
  
    it("Should burn correct amount", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
      await poolToken.grantMinter(pool.address);
  
      await stable.mint(caller.address, amount);
      await stable.connect(caller).approve(pool.address, amount);

      await pool.connect(caller).deposit(amount, stable.address);
  
      await expect(() => pool.connect(caller).withdraw(amount)).to.changeTokenBalance(poolToken, caller, 0 - amount / 10);

      expect(await poolToken.totalSupply()).to.equal(0);
    });

    it("Should fail if not enough balance", async function () {
      const { pool, stable, poolToken, owner, caller } = await loadFixture(deployPoolFixture);
  
      const amount = ethers.BigNumber.from("1000");
  
      await expect(pool.connect(caller).withdraw(amount)).to.be.revertedWith("Pool: Not enough balance");
    });
  });
});
