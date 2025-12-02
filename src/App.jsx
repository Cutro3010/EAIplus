import { useState, useEffect } from 'react'
import './App.css'
import { config } from './config'
import { personalities, getPersonality } from './personalities'

function App() {
  const [selectedPersonality, setSelectedPersonality] = useState(null)
  const [showPersonalityModal, setShowPersonalityModal] = useState(true)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [viewingImage, setViewingImage] = useState(null)
  const [theme, setTheme] = useState('white')

  useEffect(() => {
    // Check if personality was previously selected
    const savedPersonalityId = localStorage.getItem('selected_personality')
    if (savedPersonalityId) {
      const personality = getPersonality(savedPersonalityId)
      setSelectedPersonality(personality)
      setMessages([{ role: 'assistant', content: `Hello! I'm ${personality.name}. How can I help you today?` }])
      setShowPersonalityModal(false)
    } else {
      setShowPersonalityModal(false)
    }
    
    // Load saved theme
    const savedTheme = localStorage.getItem('app_theme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const selectPersonality = (personalityId) => {
    const personality = getPersonality(personalityId)
    setSelectedPersonality(personality)
    setMessages([{ role: 'assistant', content: `Hello! I'm ${personality.name}. How can I help you today?` }])
    localStorage.setItem('selected_personality', personalityId)
    setShowPersonalityModal(false)
  }

  const changePersonality = () => {
    setShowPersonalityModal(true)
    setMessages([])
  }

  const switchPersonality = (personalityId) => {
    const personality = getPersonality(personalityId)
    setSelectedPersonality(personality)
    setMessages([{ role: 'assistant', content: `Hello! I'm ${personality.name}. How can I help you today?` }])
    localStorage.setItem('selected_personality', personalityId)
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !selectedPersonality) return
    if (!config.apiKey) {
      alert('Please set your Deepseek API key in src/config.js first!')
      return
    }

    const userMessage = { role: 'user', content: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch(config.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: selectedPersonality.systemPrompt },
            ...messages.filter(m => m.role !== 'system'),
            userMessage
          ],
          max_tokens: config.maxTokens,
          temperature: config.temperature,
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      const content =
        Array.isArray(data?.choices) &&
        data.choices[0]?.message?.content
          ? data.choices[0].message.content
          : 'Sorry, I could not parse a valid response.'
      setMessages(prev => [...prev, { role: 'assistant', content }])
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${error.message}. Please check your API key in src/config.js and try again.`
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const openImageViewer = (imageSrc) => {
    setViewingImage(imageSrc)
  }

  const closeImageViewer = () => {
    setViewingImage(null)
  }

  const cycleTheme = () => {
    const themes = ['white', 'dark', 'gray', 'forest', 'wine']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    setTheme(nextTheme)
    localStorage.setItem('app_theme', nextTheme)
  }

  const parseMarkdown = (text) => {
    // Convert **text** to <strong>text</strong>
    const parts = []
    let lastIndex = 0
    const regex = /\*\*(.+?)\*\*/g
    let match

    while ((match = regex.exec(text)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      // Add the bold text
      parts.push(<strong key={match.index}>{match[1]}</strong>)
      lastIndex = regex.lastIndex
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }

    return parts.length > 0 ? parts : text
  }

  return (
    <div className={`app theme-${theme}`}>
      {/* Image Viewer Modal */}
      {viewingImage && (
        <div className="image-viewer-modal" onClick={closeImageViewer}>
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            <img src={viewingImage} alt="Avatar" className="image-viewer-img" />
            <button className="image-viewer-close" onClick={closeImageViewer}>Close</button>
          </div>
        </div>
      )}

      {/* Personality Selection Modal */}
      {showPersonalityModal && (
        <div className="personality-modal">
          <div className="personality-modal-content">
            <h2>Choose Your AI Assistant</h2>
            <p className="personality-subtitle">Select a personality to get started</p>
            <div className="personality-grid">
              {personalities.map((personality, idx) => (
                <div
                  key={`${personality.id}-${idx}`}
                  className="personality-card"
                  onClick={() => selectPersonality(personality.id)}
                >
                  <div className="personality-avatar">
                    <img src={personality.avatar} alt={personality.name} onError={(e) => { e.currentTarget.src = '/icon.jpg' }} />
                  </div>
                  <h3>{personality.name}</h3>
                  <p className="personality-description">{personality.systemPrompt.substring(0, 100)}...</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-circle">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="url(#gradient1)" opacity="0.9" />
                <circle cx="12" cy="12" r="2" fill="#000000" />
                <defs>
                  <linearGradient id="gradient1" x1="0" y1="0" x2="24" y2="24">
                    <stop offset="0%" stopColor="#FF3B5C" />
                    <stop offset="25%" stopColor="#FFD93D" />
                    <stop offset="50%" stopColor="#4A90E2" />
                    <stop offset="75%" stopColor="#00D26A" />
                    <stop offset="100%" stopColor="#FF6B88" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div className="title-group">
              <h1>{config.appTitle}</h1>
              <p className="subtitle">
                {selectedPersonality ? selectedPersonality.name : config.appSubtitle}
              </p>
            </div>
          </div>
          <button 
            className="theme-toggle-btn"
            onClick={cycleTheme}
            title="Change Theme"
          >
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Personality Selector Bar */}
      {selectedPersonality && (
        <div className="personality-selector-bar">
          <div className="personality-tabs">
            {personalities.map((personality) => (
              <div
                key={personality.id}
                className={`personality-tab ${selectedPersonality.id === personality.id ? 'active' : ''}`}
                onClick={() => switchPersonality(personality.id)}
              >
                <img 
                  src={personality.avatar} 
                  alt={personality.name} 
                  className="personality-tab-avatar"
                  onError={(e) => { e.currentTarget.src = '/icon.jpg' }}
                />
                <span className="personality-tab-name">{personality.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chat Container */}
      <div className="chat-container">
        <div className="messages">
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.role}`}>
              <div 
                className="message-avatar" 
                onClick={() => message.role === 'assistant' && openImageViewer(selectedPersonality?.avatar || '/icon.jpg')}
                style={{ cursor: message.role === 'assistant' ? 'pointer' : 'default' }}
              >
                {message.role === 'user' ? '👤' : <img src={selectedPersonality?.avatar || '/icon.jpg'} alt={selectedPersonality?.name || 'AI Assistant'} className="avatar-image" onError={(e) => { e.currentTarget.src = '/icon.jpg' }} />}
              </div>
              <div className="message-content">
                <div className="message-text">{parseMarkdown(message.content)}</div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div 
                className="message-avatar"
                onClick={() => openImageViewer(selectedPersonality?.avatar || '/icon.jpg')}
                style={{ cursor: 'pointer' }}
              >
                <img src={selectedPersonality?.avatar || '/icon.jpg'} alt={selectedPersonality?.name || 'AI Assistant'} className="avatar-image" onError={(e) => { e.currentTarget.src = '/icon.jpg' }} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="input-container">
          <div className="input-wrapper">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message here..."
              className="message-input"
              rows="1"
              disabled={isLoading || !selectedPersonality}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || !selectedPersonality}
              className="send-button"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
