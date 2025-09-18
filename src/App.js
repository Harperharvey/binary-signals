import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
import io from 'socket.io-client';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || 'https://8000-idoyux3z0t3dnod2pcc8g-0cb9cea2.manusvm.computer';

const App = () => {
  const [signal, setSignal] = useState(null);
  const [technical, setTechnical] = useState(null);
  const [stats, setStats] = useState({ totalSignals: 0, wins: 0, winRate: 0, avgConfidence: 0 });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramChatId, setTelegramChatId] = useState('7634760454');  // Default
  const [telegramToken, setTelegramToken] = useState('8257221463:AAEoq5N6ZO4UYRZQLw_rbGxb2TQEBEQJ7x8');  // Default
  const [showTelegramSettings, setShowTelegramSettings] = useState(false);
  const [timeframe, setTimeframe] = useState('1m');  // New timeframe

  const chartContainerRef = useRef();
  const socketRef = useRef();
  const chartRef = useRef();
  const candleSeriesRef = useRef();

  useEffect(() => {
    // Socket connection
    socketRef.current = io(API_BASE.replace('/api', ''), { transports: ['websocket', 'polling'] });
    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));
    socketRef.current.on('new_signal', setSignal);

    return () => socketRef.current?.disconnect();
  }, []);

  useEffect(() => {
    if (chartContainerRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: 400,
        layout: { background: { color: '#0d1117' }, textColor: '#c9d1d9' },
        grid: { vertLines: { color: '#30363d' }, horzLines: { color: '#30363d' } },
        timeScale: { borderColor: '#30363d' },
        rightPriceScale: { borderColor: '#30363d' },
      });

      candleSeriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: '#26a69a', downColor: '#ef5350', borderUpColor: '#26a69a', borderDownColor: '#ef5350',
        wickUpColor: '#26a69a', wickDownColor: '#ef5350',
      });

      // Synthetic data fallback for chart
      const syntheticData = generateSyntheticData(100, 1.0850);
      candleSeriesRef.current.setData(syntheticData);

      const handleResize = () => chartRef.current?.applyOptions({ width: chartContainerRef.current.clientWidth });
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  // Auto-poll for signals (every 30s)
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setError(null);
        const res = await axios.get(${API_BASE}/signals/${asset}?otc=${isOTC}&timeframe=${timeframe}, { timeout: 10000 });
        setSignal(res.data);
        if (res.data.status === 'active') {
          sendTelegramSignal(res.data);
        }
      } catch (err) {
        setError('Connection error - retrying...');
        console.error(err);
      }
    }, 30000);  // Auto-signal every 30s

    return () => clearInterval(interval);
  }, [asset, isOTC, timeframe]);

  const generateSyntheticData = (count, startPrice) => {
    const data = [];
    let price = startPrice;
    for (let i = 0; i < count; i++) {
      const time = Math.floor(Date.now() / 1000) - (count - i) * 60;
      const change = (Math.random() - 0.5) * 0.0008;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 0.0003;
      const low = Math.min(open, close) - Math.random() * 0.0003;
      data.push({ time, open: parseFloat(open.toFixed(5)), high: parseFloat(high.toFixed(5)), low: parseFloat(low.toFixed(5)), close: parseFloat(close.toFixed(5)) });
      price = close;
    }
    return data;
  };
const sendTelegramSignal = async (signal) => {
    try {
      await axios.post(https://api.telegram.org/bot${telegramToken}/sendMessage, {
        chat_id: telegramChatId,
        text: 🚨 AI Signal: ${signal.direction} ${asset} | Conf: ${signal.confidence}% | Price: ${signal.price} | Exp: ${signal.expire},
        parse_mode: 'Markdown'
      });
      console.log('Telegram sent!');
    } catch (err) {
      console.error('Telegram error:', err);
    }
  };

  const executeSignal = async () => {
    if (!signal || signal.status !== 'active') return;
    const text = ${signal.direction} ${asset} ${signal.expire} @ ${signal.price} (Conf: ${signal.confidence}%);
    await navigator.clipboard.writeText(text);
    alert(Copied: ${text}\nPaste into Pocket Option!);
    window.open('https://pocketoption.com/en/sign-in', '_blank');
  };

  const getSignalStyle = () => ({
    background: signal?.status === 'active' ? (signal.direction === 'CALL' ? 'linear-gradient(135deg, #26a69a, #4db6ac)' : 'linear-gradient(135deg, #ef5350, #e57373)') : '#424242',
    color: 'white'
  });

  const toggleTelegramSettings = () => setShowTelegramSettings(!showTelegramSettings);

  if (loading) return <div className="loading">Loading AI Signals...</div>;

  return (
    <div className="App">
      <header className="header">
        <h1>AI Binary Signals</h1>
        <p>80-90% Accuracy Target • Live EUR/USD Trading</p>
        <div className="status">{isConnected ? '🟢 Live' : '🔴 Offline'}</div>
        {error && <div className="error">{error}</div>}
      </header>

      <div className="container">
        <div className="controls">
          <select value={asset} onChange={(e) => setAsset(e.target.value)}>
            <option value="EURUSD">Spot EUR/USD</option>
            <option value="EURUSD-OTC">OTC EUR/USD</option>
          </select>
          <label>
            <input type="checkbox" checked={isOTC} onChange={(e) => setIsOTC(e.target.checked)} />
            OTC Mode (24/7)
          </label>
          <select value={timeframe} onChange={(e) => setTimeframe(e.target.value)}>
            <option value="1m">1m</option>
            <option value="5m">5m</option>
            <option value="15m">15m</option>
          </select>
          <button onClick={toggleTelegramSettings}>Telegram Settings</button>
        </div>

        <div ref={chartContainerRef} className="chart" />

        <div className="signal" style={getSignalStyle()}>
          {signal ? (
            signal.status === 'active' ? (
              <>
                <h2>{signal.direction} {asset}</h2>
                <p>Confidence: {signal.confidence}%</p>
                <p>Price: {signal.price}</p>
                <p>Expire: {signal.expire}</p>
                <button onClick={executeSignal}>Execute in Pocket Option</button>
              </>
            ) : (
              <p>{signal.message || 'Waiting for signal...'}</p>
            )
          ) : (
            <p>Analyzing market...</p>
          )}
        </div>

        {showTelegramSettings && (
          <div className="telegram-settings">
            <h3>Telegram Settings</h3>
            <input value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="Chat ID" />
            <input value={telegramToken} onChange={(e) => setTelegramToken(e.target.value)} placeholder="Bot Token" />
            <button onClick={() => sendTelegramSignal({direction: 'TEST', confidence: 100})}>Test Send</button>
            <button onClick={toggleTelegramSettings}>Close</button>
          </div>
        )}

        <div className="stats">
          <p>Total Signals: {stats.totalSignals}</p>
          <p>Win Rate: {stats.winRate}%</p>
          <p>Avg Confidence: {stats.avgConfidence}%</p>
        </div>
      </div>
    </div>
  );
};

export default App;
