import React, { useState, useEffect } from 'react';
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from 'aws-amplify-react'; // or 'aws-amplify-react-native';
import { createNote, deleteNote, updateNote } from './graphql/mutations'
import { listNotes } from './graphql/queries'
import { onCreateNote, onDeleteNote, onUpdateNote } from './graphql/subscriptions'
// app hooks
const App = () => {
    const [id, setId] = useState("");
    const [note, setNote] = useState("");
    const [notes, setNotes] = useState([]);
    useEffect(() => {
        getNotes();
        const createNoteListener = API.graphql(graphqlOperation(onCreateNote)).subscribe({
            next: noteData => {
                const newNote = noteData.value.data.onCreateNote;
                setNotes(prevNotes => {
                    const oldNotes = prevNotes.filter(note => note.id !== newNote.id)
                    const updatedNotes = [...oldNotes, newNote]
                    return updatedNotes
                })
                setNote('')
            }
        })
        const deleteNoteListener = API.graphql(graphqlOperation(onDeleteNote)).subscribe({
            next: noteData => {
                const deletedNote = noteData.value.data.onDeleteNote;
                setNotes(prevNotes => {
                    const updatedNotes = prevNotes.filter(note => note.id !== deletedNote.id)
                    return updatedNotes
                })
            }
        })
        const updateNoteListener = API.graphql(graphqlOperation(onUpdateNote)).subscribe({
            next: noteData => {
                const updatedNote = noteData.value.data.onUpdateNote;
                setNotes(prevNotes => {
                    const index = prevNotes.findIndex(note => note.id === updatedNote.id)
                    const updatedNotes = [...prevNotes.slice(0, index), updatedNote, ...prevNotes.slice(index + 1)];
                    return updatedNotes
                })
                setId('');
                setNote('');
            }
        })
        return () => {
            createNoteListener.unsubscribe();
            deleteNoteListener.unsubscribe();
            updateNoteListener.unsubscribe();
        }
    }, [])

    const getNotes = async () => {
        const Res = await API.graphql(graphqlOperation(listNotes))
        setNotes(Res.data.listNotes.items)
    }
    const handleChange = event => {
        const { value } = event.target
        setNote(value)
    }
    const hasExistingNote = () => {
        if (id) {
            const isNote = notes.findIndex(note => note.id === id) > -1
            return isNote
        }
        return false
    }
    const handleDeleteNote = async noteId => {
        const input = {
            id: noteId
        }
        await API.graphql(graphqlOperation(deleteNote, { input }))

    }
    const handleSetState = item => {
        const { id, note } = item
        setId(id);
        setNote(note);
    }
    const handleAddNote = async event => {
        event.preventDefault()
        if (hasExistingNote()) {
            handleUpdateNote()
        } else {
            const input = {
                note
            }
            await API.graphql(graphqlOperation(createNote, { input }))

        }

    }
    const handleUpdateNote = async () => {
        const input = {
            id, note
        }
        await API.graphql(graphqlOperation(updateNote, { input }))

    }


    return (
        <div className="flex flex-column items-center justify-center pa3 bg-washed-red">
            <h1 className="code f2-1">Note Taker</h1>
            <form onSubmit={handleAddNote} className="mb3">
                <input
                    type="text"
                    className="pa2 f4"
                    placeholder="Write the note"
                    onChange={handleChange}
                    value={note}
                />
                <button className="pa2 f4" type="submit">{id ? "Update Note" : "Add Note"}</button>
            </form>

            <div>
                {notes.map(item => (
                    <div key={item.id} className="flex item-center">
                        <li onClick={() => handleSetState(item)} className="list pa1 f3">
                            {item.note}
                        </li>
                        <button className="bg-transparent bn f4"
                            onClick={() => handleDeleteNote(item.id)}
                        >
                            <span>&times;</span>
                        </button>
                    </div>
                ))}
            </div>

        </div>
    );
}


export default withAuthenticator(App, { includeGreetings: true });
