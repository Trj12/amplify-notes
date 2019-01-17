import React, { Component } from 'react';
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'; // or 'aws-amplify-react-native';
import { createNote, deleteNote,updateNote } from './graphql/mutations'
import { listNotes } from './graphql/queries'
import {onCreateNote,onDeleteNote,onUpdateNote} from './graphql/subscriptions'
class App extends Component {
  state = {
    id: '',
    note: '',
    notes: []
  }
  componentDidMount =  () => {
   this.getNotes();
   this.createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
     next:noteData=>{
       const newNote= noteData.value.data.onCreateNote;
       const prevNotes=this.state.notes.filter(note=>note.id!==newNote.id);
       const updatedNotes=[...prevNotes,newNote];
       this.setState({notes:updatedNotes})
     }
   })
   this.deleteNoteListener =API.graphql(graphqlOperation(onDeleteNote)).subscribe({
     next:noteData=>{
      const deletedNote= noteData.value.data.onDeleteNote;
      const updatedNotes=this.state.notes.filter(note=>note.id!==deletedNote.id);
      this.setState({notes:updatedNotes})
    }
   })
   this.updateNoteListener =API.graphql(graphqlOperation(onUpdateNote)).subscribe({
    next:noteData=>{
      const {notes} =this.state
      const updatedNote= noteData.value.data.onUpdateNote;
      const index = notes.findIndex(note=>note.id===updatedNote.id)
      const updatedNotes = [...notes.slice(0,index),updatedNote,...notes.slice(index+1)];
      this.setState({
        notes:updatedNotes,note:'',id:''
      })
     
    }
   })
  }

  getNotes = async ()=>{
    const Res = await API.graphql(graphqlOperation(listNotes))
    this.setState({
      notes: Res.data.listNotes.items
    })
  }
  handleChange = event => {
    const { value } = event.target
    this.setState({
      note: value
    })
  }
  hasExistingNote = () => {
    const { id, notes } = this.state
    if(id){
     const isNote= notes.findIndex(note=>note.id===id) > -1
      return isNote
    }
    return false
  }
  handleDeleteNote = async noteId => {
    const input = {
      id: noteId
    }
   await API.graphql(graphqlOperation(deleteNote, { input }))
  
  }
  handleSetState = item => {
    const { id, note } = item
    this.setState({
      note, id
    })
  }
  handleAddNote = async event => {
    const { note } = this.state;
    event.preventDefault()
    if(this.hasExistingNote()){
      this.handleUpdateNote()
    }else{
      const input = {
        note
      }
     await API.graphql(graphqlOperation(createNote, { input }))
      this.setState({
        note: ''
      })

    }
  
  }
  handleUpdateNote = async ()=>{
    const {id, note } = this.state
    const input ={
      id,note
    }
   await API.graphql(graphqlOperation(updateNote,{input}))

  }

  componentWillUnmount=()=>{
    this.createNoteListener.unsubscribe();
    this.deleteNoteListener.unsubscribe();
    this.updateNoteListener.unsubscribe();
  }

  render() {
    const { notes, note ,id} = this.state
    return (
      <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
        <h1 className="code f2-1">Note Taker</h1>
        <form onSubmit={this.handleAddNote} className="mb3">
          <input
            type="text"
            className="pa2 f4"
            placeholder="Write the note"
            onChange={this.handleChange}
            value={note}
          />
          <button className="pa2 f4" type="submit">{id?"Update Note":"Add Note"}</button>
        </form>

        <div>
          {notes.map(item => (
            <div key={item.id} className="flex item-center">
              <li onClick={() => this.handleSetState(item)} className="list pa1 f3">
                {item.note}
              </li>
              <button className="bg-transparent bn f4"
                onClick={() => this.handleDeleteNote(item.id)}
              >
                <span>&times;</span>
              </button>
            </div>
          ))}
        </div>

      </div>
    );
  }
}

export default withAuthenticator(App, { includeGreetings: true });
