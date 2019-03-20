import React, { Component } from 'react'
import AceEditor from 'react-ace'
import brace from 'brace'
import styled from 'styled-components'
import 'brace/mode/markdown'
import 'brace/theme/cobalt'
import Markdown from 'markdown-to-jsx'
import './App.css'

const { ipcRenderer } = window.require('electron')

class App extends Component {
  state = {
    loadedFile: '',
  }

  constructor (props) {
    super(props)

    ipcRenderer.on('new-file', (event, data) => {
      this.setState({
        loadedFile: data
      })
    })
  }

  render() {
    return (
      <div className="App">
        <Header>
          Journal
        </Header>
        <Split>
          <CodeWindow>
            <AceEditor
              mode='markdown'
              theme='cobalt'
              onChange={(data) => {
                this.setState({
                  loadedFile: data,
                })
              }}
              name='mardown_editor'
              value={this.state.loadedFile}
            />
          </CodeWindow>
          <RenderedWindow>
            <Markdown>
              {this.state.loadedFile}
            </Markdown>
          </RenderedWindow>
        </Split>
      </div>
    );
  }
}

export default App;

const Header = styled.header`
  background-color: navy;
  color: #ccc;
  font-size: 0.8rem;
  height: 23px;
  text-align: center;
  position: fixed;
  top: 0;
  box-shadow: 0 3px 3px rgba(0, 0, 0, 0.2);
  left: 0;
  width: 100%;
  z-index: 10;
  -webkit-app-region: drag;
`

const Split = styled.div`
  display: flex;
  height: 100vh;
`

const RenderedWindow = styled.div`
  background-color: blue;
  width: 35%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid green;
`

const CodeWindow = styled.div`
  flex: 1;
  padding-top: 2rem;
  background-color: blue;
`
