import React, { Component } from 'react'
import AceEditor from 'react-ace'
import dateFns from 'date-fns'
import styled from 'styled-components'
import 'brace/mode/markdown'
import 'brace/theme/cobalt'
import Markdown from 'markdown-to-jsx'
import './App.css'

const fs = window.require('fs')
const path = window.require('path')
const settings = window.require('electron-settings')
const { ipcRenderer } = window.require('electron')

class App extends Component {
  state = {
    loadedFile: '',
    directory: settings.get('directory', ''),
    filesData: [],
    activeFileIndex: 0,
    newEntry: false,
    newEntryName: '',
  }

  constructor (props) {
    super(props)

      if (this.state.directory) {
        this.loadAndReadFiles(this.state.directory)
      }

    ipcRenderer.on('new-file', (event, data) => {
      this.setState({
        loadedFile: data,
      })
    })

    ipcRenderer.on('new-dir', (event, directory) => {
      this.setState({
        directory,
      })
      settings.set('directory', directory)
      this.loadAndReadFiles(directory)
    })

    ipcRenderer.on('closed-dir', event => {
      settings.delete('directory')
      this.setState({
        directory: '',
        filesData: [],
      })
    })

    ipcRenderer.on('save-file', event => {
      this.saveFile()
    })
  }

  loadAndReadFiles = (directory) => {
    fs.readdir(directory, (err, files) => {
      if (err) {
        return
      }

      const filteredFiles = files.filter(item => item.endsWith('.md'))
      const filesData = filteredFiles.map(file => {
        const date = file.substr(
          file.indexOf('_') + 1,
          file.indexOf('.md') - file.indexOf('_') - 1,
        )
        return {
          date: new Date(date),
          title: file.substr(0, file.indexOf('_')),
          path: path.join(directory, file),
        }
      })

      filesData.sort((a, b,) => {
        const aSec = a.date.getTime()
        const bSec = b.date.getTime()
        return bSec - aSec
      })

      this.setState(
        {
          filesData,
        },
        () => {
          if (filesData.length) {
            this.loadFile(0)
          }
        }
      )
    })
  }

  changeFile = (index) => () => {
    const { activeFileIndex } = this.state;
    if (index !== activeFileIndex) {
      this.saveFile()
      this.loadFile(index)
    }
  }

  loadFile = (index) => {
    const fileContents = fs.readFileSync(this.state.filesData[index].path).toString()
    this.setState({
      loadedFile: fileContents,
      activeFileIndex: index,
    })
  }

  saveFile = () => {
    const { activeFileIndex, loadedFile, filesData } = this.state;
    fs.writeFile(
      filesData[activeFileIndex].path,
      loadedFile,
      err => {
        if (err) {
          console.log(err)
          return
        }
        console.log('File saved!')
      }
    )
  }

  newFile = (e) => {
    e.preventDefault();
    const { newEntryName, directory, filesData } = this.state;
    const fileDate = dateFns.format(new Date(), 'YYYY-MM-DD')
    const filePath = path.join(directory, `${newEntryName}_${fileDate}.md`)

    fs.writeFile(filePath, '', (err) => {
      if (err) {
        console.error(err)
        return
      }

      console.log('File created!')
      filesData.unshift({
        date: fileDate,
        path: filePath,
        title: newEntryName
      })

      this.setState({
        newEntryName: '',
        newEntry: false,
        filesData,
        activeFileIndex: 0,
        loadedFile: '',
      })
    })
  }

  render() {
    const { directory, activeFileIndex, loadedFile, filesData, newEntry, newEntryName } = this.state
    return (
      <AppWrap>
        <Header>
          Journal
          {
            directory && (
              ` (${directory})`
            )
          }
        </Header>
        {
          directory ? (
            <Split>
              <FilesWindow>
                <Button
                  onClick={() => this.setState({ newEntry: !newEntry })}
                >
                  + New Entry
                </Button>
                {
                    newEntry &&
                    <form onSubmit={this.newFile}>
                      <input type="text" autoFocus value={newEntryName} onChange={e => this.setState({ newEntryName: e.target.value })} />
                    </form>
                }
                {
                  filesData.map((file, index) => (
                    <FileButton
                      active={index === activeFileIndex}
                      onClick={this.changeFile(index)}
                    >
                      <p className="title">
                        {file.title}
                      </p>
                      <p className="date">
                        {formatDate(file.date)}
                      </p>
                    </FileButton>
                  ))
                }
              </FilesWindow>
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
                  value={loadedFile}
                />
              </CodeWindow>
              <RenderedWindow>
                <Markdown>
                  {loadedFile}
                </Markdown>
              </RenderedWindow>
            </Split>
          ) : (
            <LoadMessage>
              <h1>
                Press Cmd + O to open a directory.
              </h1>
            </LoadMessage>
          )
        }
      </AppWrap>
    );
  }
}

export default App;

const AppWrap = styled.div`
  padding-top: 23px;
  height: calc(100% - 23px);
`

const Header = styled.header`
  background-color: #011e3a;
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

const LoadMessage = styled.div`
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  background-color: #002240;
`

const Split = styled.div`
  display: flex;
  height: 100%;
`

const RenderedWindow = styled.div`
  background-color: #002240;
  width: 35%;
  padding: 20px;
  color: #fff;
  border-left: 1px solid #00487b;
`

const CodeWindow = styled.div`
  flex: 1;
`

const FilesWindow = styled.div`
  background-color: #001424;
  position: relative;
  width: 20%;
  border-right: 1px solid #00487b;

  &:after {
    content: " ";
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    pointer-events: none;
    box-shadow: -10px 0 20px rgba(0, 0, 0, 0.2) inset;
  }
`

const FileButton = styled.button`
  padding: 10px;
  width: 100%;
  background-color: #15395d;
  opacity: 0.4;
  border: none;
  border-bottom: 1px solid grey;
  border-left: 0px solid rebeccapurple;
  transition: 0.3s ease-in-out all;
  color: #fff;
  text-align: left;

  &:hover {
    opacity: 1;
    border-left: 4px solid rebeccapurple;
  }

  &:focus {
    outline: none;
  }
  
  ${({ active }) => active && `
    border-left-width: 4px;
    opacity: 1;
  `}

  .title {
    font-weight: bold;
    font-size: 0.9rem;
    margin: 0 0 5px;
  }

  .date {
    margin: 0;
  }
`

const Button = styled.button`
  background: transparent;
  color: #fff;
  border: 1px solid grey;
  border-radius: 0;
  margin: 1rem auto;
  font-size: 1rem;
  transition: 0.3s ease all;
  padding: 5px 10px;
  display: block;

  &:hover {
    background-color: #15395d;
  }
`

const formatDate = date => dateFns.format(date, 'MMMM Do YYYY')
