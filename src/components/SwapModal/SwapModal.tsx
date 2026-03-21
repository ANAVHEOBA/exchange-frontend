import "./SwapModal.css";

function SwapModal() {
  return (
    <div class="swap-widget">
      {/* Tabs */}
      <div class="swap-tabs">
        <button class="tab-btn active">🔄 Swap</button>
        <button class="tab-btn">💳 Buy/Sell</button>
      </div>

      {/* Form */}
      <div class="swap-form">
        <div class="form-label">Swap Mode</div>
        
        <div class="mode-toggle">
          <button class="toggle-btn active">Standard</button>
          <button class="toggle-btn">Payment</button>
        </div>

        {/* You send input */}
        <div class="input-group">
          <div class="usd-label">~$100.00</div>
          <input type="number" placeholder="You send:" value="0.00001" />
          <button class="coin-btn">
            <span>Bitcoin</span>
            <span>˅</span>
          </button>
        </div>

        <div class="min-label">Minimum: 0.00001</div>

        {/* To trade for input */}
        <div class="input-group">
          <input type="text" placeholder="To trade for:" readonly />
          <button class="coin-btn">
            <span>Monero</span>
            <span>˅</span>
          </button>
        </div>

        <button class="exchange-btn">Exchange</button>
        
        <div class="check-link">
          <a href="#">Check your transaction ▸</a>
        </div>
      </div>
    </div>
  );
}

export default SwapModal;
